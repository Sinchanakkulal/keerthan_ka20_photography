# Crop Creation — Keerthan KA20 Photography · PRD

## Original problem statement
Build a website for "Crop Creation" (Keerthan KA20 Photography), a photo studio in Balkur Proper, Kundapura, Karnataka (owner: Keerthan Kulal, phone +91 95914 28115, 4.9★ / 51 Google reviews, Instagram @keerthan_ka20_photography). Services: all photography & videography, pre-wedding shoots, wedding + candid photography, album creation & printing, all-size photo frames & banners, all digital work. Serving Udupi, Kundapura, Mangalore. Use info from the Google listing + Instagram profile.

## User choices
- Full studio site: hero, services, portfolio gallery, reviews, contact/booking form, map & hours
- Dark cinematic style: deep charcoal + warm gold
- Gallery uses high-quality stock placeholders; admin uploads real photos manually later
- Booking form saves enquiries + simple admin view

## User personas
- Couples/families in coastal Karnataka booking wedding, pre-wedding or event shoots
- Studio owner (admin) managing enquiries and gallery photos

## Architecture
- FastAPI + MongoDB (motor) backend: JWT cookie auth (admin), enquiries CRUD, gallery with object-storage uploads (Emergent objstore), public file serving
- React 19 + Vite + Tailwind v4 frontend: Lenis smooth scroll, motion (framer) reveals, parallax kinetic hero, editorial marquee, bento services, filterable gallery + lightbox, reviews, booking form, dark map
- Fonts: Playfair Display (headings), DM Sans (body), IBM Plex Mono (meta)

## Implemented (29 Sep 2026)
- Kinetic masked-reveal hero with parallax bg, photo stack, 4.9★ rating chip, WhatsApp/book CTAs
- Editorial marquee ribbon
- About section with real studio photo (user-provided), stats, owner quote
- Services bento (6 services incl. real album-print photo)
- Gallery: 12 seeded stock placeholders, category filters, lightbox with metadata, admin-visible
- Reviews section (real Google review quotes + client stories)
- Booking form → POST /api/enquiries (toast confirm)
- Contact: address, live open/closed status (IST 9:00–20:30), call/WhatsApp/Instagram/directions, dark-styled Google map
- Admin (/admin/login → /admin): JWT cookie auth, brute-force lockout, enquiries table with status management, gallery manager (upload via object storage, hide/show, delete)
- Backend verified: all endpoints curl-tested incl. upload round-trip through public URL

## Implemented (1 Oct 2026 — iteration 2)
- Rebrand: main name now "Keerthan KA20 Photography", "Crop Creation" as sub-name; hero headline "You Dream It, We Design It."; interim "K" monogram logo (user's real logo image pending re-upload)
- Client portal (/portal): register (email+password, whitelist-gated) + login; /my-photos shows full-quality delivered photos/videos with preview lightbox, video player, and original-file download
- Admin whitelist: only studio-approved emails can register (allowed_emails collection)
- Admin Clients & Delivery tab: approve/remove emails, view registered customers, upload photos (25MB) & videos (300MB) to a specific client, delete deliveries
- Enquiry alerts: email via Emergent managed email (verified working; OWNER_ALERT_EMAIL placeholder must be replaced with the owner's real email) + Twilio WhatsApp sender that auto-activates when TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are added to backend/.env
- Owner-curated Instagram strip: admin "Insta Strip" tab pins photos (caption + optional post link); public strip above footer links back to @keerthan_ka20_photography
- Deliveries served via auth-gated route; public /api/files blocks delivery paths

## Credentials
- Admin: admin@cropcreation.in / studio2026 (see memory/test_credentials.md)
- Demo customer: demo@client.com / client2026

## Implemented (1 Oct 2026 — iteration 3)
- Real signature logo (user-uploaded) integrated: transparent-background white script in navbar, portal, admin, footer + KA20 favicon
- Download All (ZIP): GET /api/deliveries/zip (customer's own files; admin can pass ?user_email=), verified zip contains all delivered originals
- Admin credentials changed to cropcreation1@gmail.com / Crop@KA20@2020 — startup now deletes any other admin accounts so only this login works
- Enquiry email alerts now go to the owner's real inbox (cropcreation1@gmail.com) — send verified (202)
- Top nav has Client Login + Studio Login links; footer has "Developed by Sinchana Kulal · sinchanakulal04@gmail.com"

## Pending user inputs
- Twilio Account SID + Auth Token for WhatsApp alerts (email alerts already live)

## Backlog
- P1: Replace stock placeholders with real portfolio photos (owner uploads via admin)
- P1: Wedding packages/pricing section (Essential, Royal, Signature)
- P2: True Instagram API auto-sync (needs Meta app + 60-day token refresh)
- P2: Delivery expiry dates / per-folder organization

## Next tasks
1. Add Twilio credentials → WhatsApp alerts live
2. Packages section
3. Owner uploads real shoot photos
