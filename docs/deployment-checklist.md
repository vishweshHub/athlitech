# AthliTech — Production Deployment Checklist

This document details the configuration requirements, security baselines, database indices, and verification steps necessary for deploying AthliTech V1 to production.

---

## 1. Environment & Secrets Configuration

Ensure that no development settings leak into the production environment. Configure all environment variables securely:

### Backend Environments (`.env`)
- [ ] **`MONGODB_URI`**: Set to a production-grade MongoDB Atlas database cluster with strict VPC or IP whitelist rules.
- [ ] **`JWT_SECRET`**: Replace the fallback secret key with a strong, cryptographically generated random string (minimum 256-bit entropy).
- [ ] **`EXPO_PUBLIC_API_URL`**: Point the React Native application bundle to the production server domain (e.g. `https://api.athlitech.com`).
- [ ] **Disable Uvicorn Reload**: Turn off auto-reload (`--reload`) and set worker counts based on CPU cores for WSGI/ASGI servers.

---

## 2. Security Baselines

- [ ] **Enforce HTTPS / TLS**: Set up a reverse proxy (e.g., Nginx, Caddy) or Cloudflare to handle SSL termination and redirect all standard HTTP traffic to port 443.
- [ ] **CORS Origins Whitelisting**: Restrict `FRONTEND_ORIGINS` in the backend configuration to the explicit production web app URL and mobile client schemes.
- [ ] **JWT Token Expiry**: Keep access token expiries short (e.g., 15 minutes) and verify refresh token database validity.
- [ ] **Do NOT overwrite seeded credentials**: Ensure user seed scripts are only run once during initial bootstrap to protect user security.

---

## 3. Database Optimizations & Indices

Because the dynamic collections (Users, Athletes, Workouts, Performances) will scale, database lookups must use indexes to avoid linear collection scans.

Run the following MongoDB index commands on your production database:

### Users Collection
```javascript
// Ensure email searches are indexed and globally unique
db.users.createIndex({ "email": 1 }, { unique: true })
```

### Athletes Collection
```javascript
// Index lookup queries mapping athlete user IDs
db.athletes.createIndex({ "athlete_id": 1 })
// Index queries filtering by coaches
db.athletes.createIndex({ "coach_id": 1 })
```

### Workouts Collection
```javascript
// Index workout assignments
db.workouts.createIndex({ "athlete_id": 1 })
db.workouts.createIndex({ "coach_id": 1 })
db.workouts.createIndex({ "status": 1 })
```

### Performance Collection
```javascript
// Index performance log entries
db.performance.createIndex({ "athlete_id": 1 })
db.performance.createIndex({ "coach_id": 1 })
db.performance.createIndex({ "sport_event": 1 })
```

---

## 4. Pre-Deployment Validation Steps

Before routing live users to the release version:
1.  [ ] **Run Linting Suites**: Ensure the React Native client contains no syntax issues (`npm run lint`).
2.  [ ] **Run Backend pytest Suites**: Run `PYTHONPATH=. venv/bin/pytest` and verify that 100% of collection tests pass.
3.  [ ] **Test Secure Token Adaptations**: Log in to Android/iOS builds, close the application, and reopen to confirm session persistence.
4.  [ ] **Cascade Integrity Check**: Delete a test athlete/coach from the Admin panel and check MongoDB to ensure all dependent documents were clean-deleted or dissociated.
