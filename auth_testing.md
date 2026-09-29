# Auth Testing Playbook (Crop Creation)

Step 1: MongoDB verification
```
mongosh
use app
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`; indexes on users.email (unique), users.id (unique), login_attempts.identifier, enquiries.id (unique), gallery.id (unique).

Step 2: API testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@cropcreation.in","password":"studio2026"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
curl -b cookies.txt -X POST http://localhost:8001/api/auth/refresh
curl -b cookies.txt -X POST http://localhost:8001/api/auth/logout
```
Login returns the admin user and sets `access_token` + `refresh_token` cookies. /me returns the same user via cookies.

Negative cases: wrong password -> 401; 5 wrong attempts -> 429 lockout; /api/enquiries without cookie -> 401.
