import asyncio
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import bcrypt
import httpx
import ipaddress
import jwt
import re
import requests
from html.parser import HTMLParser
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import Response as RawResponse
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from starlette.middleware.cors import CORSMiddleware

from lib.db import client, db, ensure_indexes

logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 15
REFRESH_TOKEN_DAYS = 7

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "crop-creation"
storage_key = None

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Keerthan KA20 Photography")
OWNER_ALERT_EMAIL = os.environ.get("OWNER_ALERT_EMAIL", "")
APP_URL = os.environ.get("APP_URL", "")


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=300,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=120)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---- Email guardrail gate (managed email integration) ----
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    _assert_safe_email(subject, html)
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set; skipping email")
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error("Email send failed: %s", e)
        return None


def _send_whatsapp_sync(body: str):
    from twilio.rest import Client
    twilio_client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
    from_num = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155232386")
    to_num = os.environ.get("OWNER_WHATSAPP", "whatsapp:+919591428115")
    twilio_client.messages.create(from_=from_num, to=to_num, body=body)


async def notify_owner_enquiry(e: "Enquiry"):
    lines = [
        f"New enquiry — {EMAIL_FROM_NAME}",
        f"Name: {e.name}",
        f"Phone: {e.phone}",
        f"Event: {e.event_type}",
    ]
    if e.event_date:
        lines.append(f"Date: {e.event_date}")
    if e.location:
        lines.append(f"Location: {e.location}")
    if e.message:
        lines.append(f"Message: {e.message}")
    text_body = "\n".join(lines)

    if os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN"):
        try:
            await asyncio.to_thread(_send_whatsapp_sync, text_body)
            logger.info("WhatsApp alert sent to owner")
        except Exception as err:
            logger.error("WhatsApp alert failed: %s", err)

    if OWNER_ALERT_EMAIL:
        rows = "".join(
            f'<tr><td style="padding:6px 12px;color:#888;font-size:13px">{escape(k)}</td>'
            f'<td style="padding:6px 12px;font-size:13px"><strong>{escape(v)}</strong></td></tr>'
            for k, v in [
                ("Name", e.name), ("Phone", e.phone), ("Event", e.event_type),
                ("Date", e.event_date or "—"), ("Location", e.location or "—"),
                ("Message", e.message or "—"),
            ]
        )
        link = f"{APP_URL}/admin" if APP_URL else "#"
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif">'
            f'<h2 style="margin:0 0 12px">New booking enquiry</h2>'
            f'<table role="presentation" style="border-collapse:collapse">{rows}</table>'
            f'<p style="margin-top:16px"><a href="{escape(link)}">Open Studio Desk</a></p>'
            f'<p style="font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)} website.</p>'
            "</td></tr></table>"
        )
        await send_email(to=OWNER_ALERT_EMAIL, subject=f"New enquiry: {e.event_type} — {e.name}", html=html)


# ---- Auth ----
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie(
        "access_token", access, httponly=True, secure=True, samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=True, samesite="none",
        max_age=REFRESH_TOKEN_DAYS * 86400, path="/",
    )


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user["id"], "email": user["email"], "name": user.get("name", "User"), "role": user.get("role", "customer")}


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def seed_admin():
    email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    if not email or not password:
        logger.warning("ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin seed")
        return
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Keerthan Kulal",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded: %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Admin password refreshed from env")


async def ensure_app_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.enquiries.create_index("id", unique=True)
    await db.gallery.create_index("id", unique=True)
    await db.allowed_emails.create_index("email", unique=True)
    await db.delivery_files.create_index("id", unique=True)
    await db.delivery_files.create_index("user_email")
    await db.insta_posts.create_index("id", unique=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    app.state.app_index_task = asyncio.create_task(ensure_app_indexes())
    await seed_admin()
    from seed import seed_data
    await seed_data()
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error("Storage init failed: %s", e)
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ---- Models ----
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=6, max_length=100)


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=6, max_length=25)
    event_type: str = Field(min_length=1, max_length=60)
    event_date: Optional[str] = None
    location: Optional[str] = None
    message: Optional[str] = None


class Enquiry(EnquiryCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EnquiryStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "booked", "archived"]


class GalleryItem(BaseModel):
    id: str
    title: str
    category: str
    caption: Optional[str] = None
    location: Optional[str] = None
    meta: Optional[str] = None
    image_url: Optional[str] = None
    storage_path: Optional[str] = None
    visible: bool = True
    created_at: str


class GalleryItemUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    caption: Optional[str] = None
    visible: Optional[bool] = None


class AllowedEmailCreate(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    note: Optional[str] = None


class AllowedEmail(BaseModel):
    id: str
    email: str
    note: Optional[str] = None
    created_at: str


class DeliveryFile(BaseModel):
    id: str
    user_email: str
    storage_path: str
    original_filename: str
    content_type: str
    kind: str
    size: int
    caption: Optional[str] = None
    created_at: str


class InstaPost(BaseModel):
    id: str
    storage_path: str
    caption: Optional[str] = None
    permalink: Optional[str] = None
    visible: bool = True
    created_at: str


class InstaPostUpdate(BaseModel):
    caption: Optional[str] = None
    permalink: Optional[str] = None
    visible: Optional[bool] = None


# ---- Routes ----
@api_router.get("/")
async def root():
    return {"message": "Keerthan KA20 Photography API", "status": "ok"}


@api_router.post("/auth/register", response_model=UserOut, status_code=201)
async def register(body: RegisterRequest, response: Response):
    email = body.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists — please sign in")
    allowed = await db.allowed_emails.find_one({"email": email})
    if not allowed:
        raise HTTPException(status_code=403, detail="This email isn't approved for client access yet — please contact the studio to get access")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name.strip(),
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    set_auth_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return UserOut(id=user["id"], email=email, name=user["name"], role="customer")


@api_router.post("/auth/login", response_model=UserOut)
async def login(body: LoginRequest, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        locked_until = datetime.fromisoformat(attempt["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (attempt.get("count", 0) if attempt else 0) + 1
        update = {"count": count, "last_attempt": datetime.now(timezone.utc).isoformat()}
        if count >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            update["count"] = 0
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_many({"identifier": identifier})
    set_auth_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return UserOut(id=user["id"], email=email, name=user.get("name", "User"), role=user.get("role", "customer"))


@api_router.post("/auth/refresh", response_model=UserOut)
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie(
        "access_token", create_access_token(user["id"], user["email"]),
        httponly=True, secure=True, samesite="none", max_age=ACCESS_TOKEN_MINUTES * 60, path="/",
    )
    return UserOut(id=user["id"], email=user["email"], name=user.get("name", "User"), role=user.get("role", "customer"))


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(**user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.post("/enquiries", response_model=Enquiry, status_code=201)
async def create_enquiry(body: EnquiryCreate):
    enquiry = Enquiry(**body.model_dump())
    await db.enquiries.insert_one(enquiry.model_dump())
    asyncio.create_task(notify_owner_enquiry(enquiry))
    return enquiry


@api_router.get("/enquiries", response_model=List[Enquiry])
async def list_enquiries(admin: dict = Depends(require_admin)):
    docs = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Enquiry(**d) for d in docs]


@api_router.patch("/enquiries/{enquiry_id}/status", response_model=Enquiry)
async def update_enquiry_status(enquiry_id: str, body: EnquiryStatusUpdate, admin: dict = Depends(require_admin)):
    doc = await db.enquiries.find_one_and_update(
        {"id": enquiry_id},
        {"$set": {"status": body.status}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return Enquiry(**doc)


# ---- Gallery (public portfolio) ----
@api_router.get("/gallery", response_model=List[GalleryItem])
async def public_gallery():
    docs = await db.gallery.find({"is_deleted": {"$ne": True}, "visible": True}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [GalleryItem(**d) for d in docs]


@api_router.get("/gallery/all", response_model=List[GalleryItem])
async def admin_gallery(admin: dict = Depends(require_admin)):
    docs = await db.gallery.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [GalleryItem(**d) for d in docs]


ALLOWED_IMAGE_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
ALLOWED_VIDEO_TYPES = {"mp4": "video/mp4", "mov": "video/quicktime", "webm": "video/webm", "m4v": "video/mp4"}


@api_router.post("/gallery/upload", response_model=GalleryItem, status_code=201)
async def upload_gallery(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    caption: str = Form(""),
    location: str = Form(""),
    admin: dict = Depends(require_admin),
):
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WebP images are allowed")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 25 MB")
    path = f"{APP_NAME}/gallery/{uuid.uuid4()}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, ALLOWED_IMAGE_TYPES[ext])
    except Exception as e:
        logger.error("Storage upload failed: %s", e)
        raise HTTPException(status_code=502, detail="Photo storage is unavailable right now")
    item = GalleryItem(
        id=str(uuid.uuid4()),
        title=title.strip() or "Untitled",
        category=category,
        caption=caption.strip() or None,
        location=location.strip() or None,
        meta=None,
        image_url=None,
        storage_path=result["path"],
        visible=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    await db.gallery.insert_one(item.model_dump())
    return item


@api_router.patch("/gallery/{item_id}", response_model=GalleryItem)
async def update_gallery_item(item_id: str, body: GalleryItemUpdate, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    doc = await db.gallery.find_one_and_update(
        {"id": item_id, "is_deleted": {"$ne": True}},
        {"$set": updates},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Photo not found")
    return GalleryItem(**doc)


@api_router.delete("/gallery/{item_id}")
async def delete_gallery_item(item_id: str, admin: dict = Depends(require_admin)):
    res = await db.gallery.update_one({"id": item_id}, {"$set": {"is_deleted": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"ok": True}


# ---- Client accounts: whitelist ----
@api_router.get("/allowed-emails", response_model=List[AllowedEmail])
async def list_allowed_emails(admin: dict = Depends(require_admin)):
    docs = await db.allowed_emails.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [AllowedEmail(**d) for d in docs]


@api_router.post("/allowed-emails", response_model=AllowedEmail, status_code=201)
async def add_allowed_email(body: AllowedEmailCreate, admin: dict = Depends(require_admin)):
    email = body.email.strip().lower()
    existing = await db.allowed_emails.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="This email is already approved")
    doc = AllowedEmail(
        id=str(uuid.uuid4()),
        email=email,
        note=(body.note or "").strip() or None,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    await db.allowed_emails.insert_one(doc.model_dump())
    return doc


@api_router.delete("/allowed-emails/{entry_id}")
async def remove_allowed_email(entry_id: str, admin: dict = Depends(require_admin)):
    res = await db.allowed_emails.delete_one({"id": entry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@api_router.get("/users", response_model=List[UserOut])
async def list_customers(admin: dict = Depends(require_admin)):
    docs = await db.users.find({"role": "customer"}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [UserOut(id=d["id"], email=d["email"], name=d.get("name", "User"), role="customer") for d in docs]


# ---- Client deliveries (per-customer files) ----
@api_router.post("/deliveries/upload", response_model=DeliveryFile, status_code=201)
async def upload_delivery(
    file: UploadFile = File(...),
    user_email: str = Form(...),
    caption: str = Form(""),
    admin: dict = Depends(require_admin),
):
    email = user_email.strip().lower()
    customer = await db.users.find_one({"email": email, "role": "customer"})
    if not customer:
        raise HTTPException(status_code=404, detail="No registered customer with this email — approve the email and ask them to create an account first")
    filename = file.filename or "file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ALLOWED_IMAGE_TYPES:
        kind, content_type, max_size = "image", ALLOWED_IMAGE_TYPES[ext], 25 * 1024 * 1024
    elif ext in ALLOWED_VIDEO_TYPES:
        kind, content_type, max_size = "video", ALLOWED_VIDEO_TYPES[ext], 300 * 1024 * 1024
    else:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP images or MP4, MOV, WebM videos are allowed")
    data = await file.read()
    if len(data) > max_size:
        raise HTTPException(status_code=400, detail="Image too large (25 MB max) or video too large (300 MB max)")
    path = f"{APP_NAME}/deliveries/{uuid.uuid4()}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, content_type)
    except Exception as e:
        logger.error("Delivery upload failed: %s", e)
        raise HTTPException(status_code=502, detail="File storage is unavailable right now")
    doc = DeliveryFile(
        id=str(uuid.uuid4()),
        user_email=email,
        storage_path=result["path"],
        original_filename=filename,
        content_type=content_type,
        kind=kind,
        size=result.get("size", len(data)),
        caption=caption.strip() or None,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    await db.delivery_files.insert_one(doc.model_dump())
    return doc


@api_router.get("/deliveries", response_model=List[DeliveryFile])
async def list_deliveries(admin: dict = Depends(require_admin)):
    docs = await db.delivery_files.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [DeliveryFile(**d) for d in docs]


@api_router.get("/deliveries/mine", response_model=List[DeliveryFile])
async def my_deliveries(user: dict = Depends(get_current_user)):
    docs = await db.delivery_files.find(
        {"user_email": user["email"], "is_deleted": {"$ne": True}}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return [DeliveryFile(**d) for d in docs]


@api_router.delete("/deliveries/{file_id}")
async def delete_delivery(file_id: str, admin: dict = Depends(require_admin)):
    res = await db.delivery_files.update_one({"id": file_id}, {"$set": {"is_deleted": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"ok": True}


@api_router.get("/deliveries/{file_id}/file")
async def serve_delivery(file_id: str, download: int = 0, user: dict = Depends(get_current_user)):
    doc = await db.delivery_files.find_one({"id": file_id, "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    if user["role"] != "admin" and doc["user_email"] != user["email"]:
        raise HTTPException(status_code=403, detail="This file belongs to another client")
    try:
        data, content_type = await asyncio.to_thread(get_object, doc["storage_path"])
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")
    headers = {"Cache-Control": "private, max-age=3600"}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{doc["original_filename"]}"'
    return RawResponse(content=data, media_type=doc.get("content_type", content_type), headers=headers)


# ---- Instagram strip (owner-curated) ----
@api_router.get("/insta-strip", response_model=List[InstaPost])
async def public_insta_strip():
    docs = await db.insta_posts.find({"is_deleted": {"$ne": True}, "visible": True}, {"_id": 0}).sort("created_at", -1).to_list(24)
    return [InstaPost(**d) for d in docs]


@api_router.get("/insta-strip/all", response_model=List[InstaPost])
async def admin_insta_strip(admin: dict = Depends(require_admin)):
    docs = await db.insta_posts.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [InstaPost(**d) for d in docs]


@api_router.post("/insta-strip/upload", response_model=InstaPost, status_code=201)
async def upload_insta_post(
    file: UploadFile = File(...),
    caption: str = Form(""),
    permalink: str = Form(""),
    admin: dict = Depends(require_admin),
):
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WebP images are allowed")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 25 MB")
    path = f"{APP_NAME}/insta/{uuid.uuid4()}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, ALLOWED_IMAGE_TYPES[ext])
    except Exception as e:
        logger.error("Insta upload failed: %s", e)
        raise HTTPException(status_code=502, detail="Photo storage is unavailable right now")
    doc = InstaPost(
        id=str(uuid.uuid4()),
        storage_path=result["path"],
        caption=caption.strip() or None,
        permalink=permalink.strip() or None,
        visible=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    await db.insta_posts.insert_one(doc.model_dump())
    return doc


@api_router.patch("/insta-strip/{post_id}", response_model=InstaPost)
async def update_insta_post(post_id: str, body: InstaPostUpdate, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    doc = await db.insta_posts.find_one_and_update(
        {"id": post_id, "is_deleted": {"$ne": True}},
        {"$set": updates},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return InstaPost(**doc)


@api_router.delete("/insta-strip/{post_id}")
async def delete_insta_post(post_id: str, admin: dict = Depends(require_admin)):
    res = await db.insta_posts.update_one({"id": post_id}, {"$set": {"is_deleted": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}


# ---- Public file serving (gallery + insta only; deliveries are auth-gated) ----
@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    if not path.startswith(f"{APP_NAME}/") or ".." in path or "/deliveries/" in path:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return RawResponse(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
