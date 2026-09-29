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

## Credentials
- Admin: admin@cropcreation.in / studio2026 (see memory/test_credentials.md)

## Backlog
- P1: Replace stock placeholders with real Instagram portfolio photos (owner uploads via admin)
- P1: Wedding packages/pricing section (Essential, Royal, Signature)
- P2: WhatsApp/Resend notification to owner on new enquiry
- P2: Multi-photo lightbox zoom + EXIF edit in admin
- P2: Google reviews live sync

## Next tasks
1. Owner uploads real shoot photos in Gallery Manager
2. Add pricing/packages section
3. Enquiry notifications (WhatsApp/email)
