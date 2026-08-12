# AthliTech — Final Live Demonstration Script

> **Purpose:** 10–15 Minute Internship & Project Evaluation Live Demonstration Guide  
> **Target Audience:** Project Evaluators, Mentors, Technical Reviewers  
> **Source Files Verified:**  
> - [README.md](file:///home/vishwesh/athlitech-app/README.md)  
> - [docs/architecture.md](file:///home/vishwesh/athlitech-app/docs/architecture.md)  
> - [docs/DATABASE_ARCHITECTURE.md](file:///home/vishwesh/athlitech-app/docs/DATABASE_ARCHITECTURE.md)  
> - [docs/API_DOCUMENTATION.md](file:///home/vishwesh/athlitech-app/docs/API_DOCUMENTATION.md)  
> - [docs/AUTHENTICATION_RBAC.md](file:///home/vishwesh/athlitech-app/docs/AUTHENTICATION_RBAC.md)  
> - [docs/END_TO_END_WORKFLOWS.md](file:///home/vishwesh/athlitech-app/docs/END_TO_END_WORKFLOWS.md)  
> - [docs/INTERNSHIP_PROJECT_REPORT.md](file:///home/vishwesh/athlitech-app/docs/INTERNSHIP_PROJECT_REPORT.md)

---

## 1. Demo Objective

The primary objective of this live demonstration is to empirically prove that **AthliTech** is a fully functional, integrated full-stack prototype. The demonstration proves that:

1. **Integrated Full-Stack Architecture**: React Native / Expo Web frontend seamlessly communicates with Python FastAPI backend and MongoDB database.
2. **End-to-End Workflows**: Athlete, Coach, and Admin user journeys operate cohesively.
3. **Robust Security & RBAC**: Bcrypt hashing, JWT authentication, and role dependencies strictly enforce access boundaries.
4. **Workout & Execution Lifecycle**: Reusable templates transition into scheduled plan assignments, live interactive workout sessions, and quantitative performance logs.
5. **Multi-Role Workspace (Role Hub)**: A single account identity dynamically switches between Athlete, Coach, and Organization operational view modes.
6. **Organization & Membership Management**: Organization creation, subscription tracking, and secure invitation link generation function as designed.

*Note: Unimplemented AI predictions, real-time WebSocket telemetry, and live Stripe card processing are excluded from this live demonstration.*

---

## 2. Pre-Demo Checklist

Ensure all system layers are active prior to beginning the presentation:

* [ ] **MongoDB Service**: Database running on `mongodb://127.0.0.1:27017` (Database `athlitech`).
* [ ] **FastAPI Backend Server**: Running on `http://127.0.0.1:8000` (`python -m uvicorn backend.main:app --reload`).
* [ ] **Frontend Web Server**: Running on `http://localhost:8081` (`npx expo start --web`).
* [ ] **Browser Prepared**: Chrome/Edge open in Incognito/Clean session at `http://localhost:8081`.
* [ ] **Prepared Test Credentials**:
  * Athlete Account: `athlete.demo@athlitech.com` / `<DemoPassword123!>`
  * Coach Account: `coach.demo@athlitech.com` / `<DemoPassword123!>`
  * Admin Account: `admin.demo@athlitech.com` / `<DemoPassword123!>`
* [ ] **Network & DevTools**: Developer Console open to Network tab (filtered by Fetch/XHR) to demonstrate live 200/201 REST responses.

---

## 3. Demo Flow (10–15 Minute Chronological Agenda)

```
00:00 - 01:30 | Part 1: Project Introduction & Problem Statement
01:30 - 03:30 | Part 2: Athlete Registration, Login & Profile Completion
03:30 - 05:00 | Part 3: Athlete Dashboard & Workout Library Search
05:00 - 07:00 | Part 4: Live Workout Execution & Metric Performance Logging
07:00 - 08:30 | Part 5: Role Hub & Multi-Role Workspace Switch
08:30 - 10:30 | Part 6: Coach Roster & Periodized Plan Assignment Workflow
10:30 - 12:00 | Part 7: Admin Panel & User/Role Governance
12:00 - 13:00 | Part 8: Organization Management & Invitation Link Generation
13:00 - 14:30 | Part 9: Technical Architecture Overview & Codebase Summary
14:30 - 15:00 | Demo Closing & Evaluator Q&A Transition
```

---

## 4. Demo Sequence

### PART 1 — Introduction (1:30)
* **TIME**: 00:00 – 01:30
* **ACTION**: Presenter displays Landing Page (`http://localhost:8081`).
* **WHAT TO SHOW**: Hero header, features list, Role Showcase buttons, and Login/Register navigation.
* **WHAT TO SAY**:  
  *"Good morning evaluators. Today I am demonstrating AthliTech, a full-stack athlete performance management platform. Traditional sports training suffers from fragmented tracking—athletes use spreadsheets, coaches send text messages, and performance data is lost. AthliTech centralizes workout creation, periodized training plans, live session execution, and performance tracking into a unified multi-tenant application."*
* **EXPECTED RESULT**: Landing page renders cleanly with responsive hero layout.
* **BACKUP IF FAILS**: Refresh `http://localhost:8081`; verify Expo web dev server is running.

---

### PART 2 — Athlete Registration & Profile Completion (2:00)
* **TIME**: 01:30 – 03:30
* **ACTION**: Click "Sign Up" → Register new athlete → Log in → Complete Profile form.
* **WHAT TO SHOW**:
  1. `/register`: Form fields (Name, Email, Password, Role: Athlete).
  2. `/login`: Credential submission returning JWT access token.
  3. `/complete-profile`: Onboarding form (Sport: Sprinting, Event: 100m, Height, Weight, Goals).
* **WHAT TO SAY**:  
  *"Let's register a new athlete account. Behind the scenes, the FastAPI backend hashes the password using bcrypt and dual-writes the identity into MongoDB 'users' and 'accounts' collections. Upon login, a JWT access token is issued and stored in localStorage on Web or Expo SecureStore on Mobile. Once the athlete completes their profile metadata, the system sets 'profile_completed: true' and immediately unlocks the athlete workspace."*
* **EXPECTED RESULT**: Successful registration, JWT token acquisition, profile update, and redirection to `/athlete-dashboard`.
* **BACKUP IF FAILS**: Use pre-seeded test account `athlete.demo@athlitech.com`.

---

### PART 3 — Athlete Dashboard & Workout Library (1:30)
* **TIME**: 03:30 – 05:00
* **ACTION**: Explore `/athlete-dashboard` → Navigate to `/workout-library` → Apply filters.
* **WHAT TO SHOW**:
  1. Athlete Dashboard summary metrics and Today's Training widget.
  2. Workout Library with sport dropdown ("Sprinting"), category filter ("Speed"), and search bar.
  3. Clicking "Save to My Workouts" on a template card.
* **WHAT TO SAY**:  
  *"Here is the Athlete Dashboard. Moving to the Workout Library, athletes can query workout templates. Selecting 'Sprinting' and filtering by 'Speed' triggers an asynchronous GET request to FastAPI, querying indexed MongoDB template documents. Clicking 'Save to My Workouts' calls POST /athletes/me/saved-workouts, bookmarking the template to the athlete's personal collection."*
* **EXPECTED RESULT**: Library filters instantly update template cards; bookmarking inserts document into `athlete_saved_workouts`.
* **BACKUP IF FAILS**: Clear search filter inputs to restore full template list.

---

### PART 4 — Live Workout Execution & Performance Logging (2:00)
* **TIME**: 05:00 – 07:00
* **ACTION**: Launch workout session → Pause/Resume → Enter set metrics → Complete Session.
* **WHAT TO SHOW**:
  1. `/workout-session`: Active workout execution interface with timer and status badge (`"in_progress"`).
  2. Clicking "Pause" (`"paused"`) and "Resume" (`"in_progress"`).
  3. Logging exercise performance: Sprint Time `10.45` sec, RPE `8`, Set Notes.
  4. Clicking "Complete Session".
* **WHAT TO SAY**:  
  *"Now we launch live workout execution. Clicking 'Start Workout' creates a 'workout_sessions' record with status 'in_progress'. The session supports real-time state transitions like Pause and Resume. When the athlete logs an exercise set, POST /performance-logs evaluates whether the score exceeds historical entries to mark it as a Personal Record (PR). Clicking 'Complete Session' finalizes total elapsed duration and records completion status."*
* **EXPECTED RESULT**: State badges toggle accurately; performance log entry is persisted; completion updates `workout_sessions` document.
* **BACKUP IF FAILS**: Navigate directly to `/performance-log` to demonstrate historical performance log entries.

---

### PART 5 — Role Hub & Multi-Role Workspace Switch (1:30)
* **TIME**: 07:00 – 08:30
* **ACTION**: Open `/role-hub` → Activate Coach Role → Switch Workspace to Coach.
* **WHAT TO SHOW**:
  1. Role Hub screen showing active roles (`['athlete']`) and available roles (`coach`, `organization`).
  2. Clicking "Activate Coach Role" (`POST /role-profiles/activate`).
  3. Clicking "Switch to Coach Workspace", redirecting to `/coach-dashboard`.
* **WHAT TO SAY**:  
  *"A major architectural innovation in AthliTech is the Role Hub workspace switcher. Instead of requiring users to register separate accounts for coaching versus training, AthliTech separates single account identity from operational workspace views. Clicking 'Activate Coach Role' provisions a coach profile in MongoDB. The frontend WorkspaceContext updates active roles and allows switching to the Coach Dashboard without logging out."*
* **EXPECTED RESULT**: Role profile activated instantly; WorkspaceContext updates `currentWorkspace = 'coach'`; routes cleanly to `/coach-dashboard`.
* **BACKUP IF FAILS**: Log out and log in with dedicated pre-seeded coach account (`coach.demo@athlitech.com`).

---

### PART 6 — Coach Workflow & Workout Assignment (2:00)
* **TIME**: 08:30 – 10:30
* **ACTION**: View Coach Dashboard → Open "My Athletes" roster → Select athlete → Create Plan Assignment.
* **WHAT TO SHOW**:
  1. `/coach-dashboard`: Coach summary widgets and assigned athlete roster (`GET /coaches/{id}/athletes`).
  2. Athlete detail inspection (`GET /athletes/{athlete_id}`).
  3. Training Plan Manager: Assigning a workout template from the library to an athlete's training session (`POST /training-plans/assignments/`).
* **WHAT TO SAY**:  
  *"In the Coach Workspace, the coach views their assigned roster. Service-level scoping ensures coaches can only access athletes assigned to them. To schedule workouts, the coach creates a periodized training plan and assigns a template from the workout library using POST /training-plans/assignments/. The backend verifies that the target athlete is assigned to this coach before persisting the assignment."*
* **EXPECTED RESULT**: Assigned athlete roster loads; workout template is mapped to training session; assignment is persisted in `workout_assignments` collection.
* **BACKUP IF FAILS**: Demonstrate existing assigned workouts under athlete's Today's Training view.

---

### PART 7 — Admin Workflow & Governance (1:30)
* **TIME**: 10:30 – 12:00
* **ACTION**: Log in as Admin (`admin.demo@athlitech.com`) → View `/dashboard` → Open User & Role Management.
* **WHAT TO SHOW**:
  1. Admin summary dashboard (`GET /dashboard/admin/summary`).
  2. User Management table (`GET /users/`): Modifying user primary role (`PUT /users/{id}/role`).
  3. Role Management table (`GET /roles/`): View custom roles and permissions.
* **WHAT TO SAY**:  
  *"Logging in with an Administrator account triggers the 'require_admin' FastAPI dependency guard. The Admin Dashboard presents system-wide health and user counts. In User Management, administrators can edit user roles or delete accounts. Administrators can also manage custom system roles and update granular permission arrays."*
* **EXPECTED RESULT**: Admin dashboard metrics display; user role modifications update successfully.
* **BACKUP IF FAILS**: Show static role permission definitions in backend `constants.py`.

---

### PART 8 — Organization Management & Invitations (1:00)
* **TIME**: 12:00 – 13:00
* **ACTION**: Open Organization view (`/organization`) → View Plan Tier → Generate Invitation Link.
* **WHAT TO SHOW**:
  1. Organization details and current plan tier (`GET /organization/my-organization`).
  2. Clicking "Invite Member" (`POST /organization/my-organization/invitations`), generating invitation link.
* **WHAT TO SAY**:  
  *"For multi-tenant organizational management, AthliTech supports organization creation and member invitations. The org owner can update subscription tiers and generate secure invitation links with embedded tokens to invite coaches and athletes to the organization."*
* **EXPECTED RESULT**: Generated invitation link appears in dialog (`https://athlitech.app/join?org=...&token=...`).
* **BACKUP IF FAILS**: Explain invitation payload schema verbally using API documentation.

---

### PART 9 — Technical Architecture Explanation (1:30)
* **TIME**: 13:00 – 14:30
* **ACTION**: Presenter displays Architecture Summary diagram or terminal test suite execution.
* **WHAT TO SHOW**:
  1. Terminal view showing 22/22 Pytest passing (`pytest backend/tests/`).
  2. Clean architecture diagram (Frontend → FastAPI → Auth/RBAC → Services → Repositories → MongoDB).
* **WHAT TO SAY**:  
  *"Architecturally, AthliTech is built for decoupled scalability. The React Native frontend uses an API abstraction layer with structured ApiError handling. FastAPI handles routing and Pydantic validation, delegating business logic to services like training_plan_service for plan scoping. Repositories handle non-blocking asynchronous MongoDB Motor operations. Our automated test suite passes 100% of unit and integration tests across 94 REST endpoints."*
* **EXPECTED RESULT**: Terminal confirms `22 passed in 1.42s`.
* **BACKUP IF FAILS**: Show test report summary in `INTERNSHIP_PROJECT_REPORT.md`.

---

## 5. Spoken Presenter Talking Points

### Introduction
> *"AthliTech was built to solve the fragmentation of athletic performance data. Rather than relying on spreadsheets and chat apps, AthliTech provides a centralized platform connecting athletes, coaches, and administrators."*

### Authentication & Security
> *"Security is enforced at every layer. Passwords are hashed with bcrypt, access tokens use short-lived JWTs, and refresh tokens are handled via HttpOnly cookies. Route guards like require_admin enforce strict Role-Based Access Control."*

### Workout & Performance Engine
> *"Workouts follow a strict lifecycle: reusable templates created in the library are assigned to periodized training plans, executed through interactive live sessions, and logged as quantitative exercise performance records."*

### Workspace Architecture (Role Hub)
> *"Instead of forcing users to register separate accounts for coaching versus training, our Role Hub architecture decouples account identity from operational views, allowing seamless workspace switching from a single login."*

---

## 6. Expected Evaluator Questions & Confident Answers

**Q1: Why did you choose FastAPI over Flask or Django?**  
*A:* FastAPI provides native asynchronous ASGI performance out of the box, automatic Pydantic type validation, OpenAPI documentation generation, and lightweight dependency injection perfect for decoupled microservices.

**Q2: Why use MongoDB instead of a Relational Database like PostgreSQL?**  
*A:* Athletic workouts and exercise performance metrics vary widely across sports (e.g. sprint times vs. weight lifting sets). MongoDB’s flexible document model easily handles dynamic nested metrics while maintaining fast query speeds with Motor async drivers.

**Q3: How does authentication and token storage work?**  
*A:* Passwords are hashed with bcrypt. Upon login, FastAPI returns a JWT access token sent in HTTP Bearer headers, while a refresh token is set in an HttpOnly cookie. On the frontend, tokens are stored in `localStorage` on Web or `Expo.SecureStore` on Native mobile.

**Q4: What is the difference between a Role and a Workspace in AthliTech?**  
*A:* A **Role** is an account entitlement stored in `role_profiles`. A **Workspace** is the active UI operational view (`currentWorkspace` in `WorkspaceContext`) selected by the user to focus their UI on athlete, coach, or org management.

**Q5: How do you prevent a coach from accessing another coach's athletes?**  
*A:* In addition to route guards, our service layer enforces resource-level scoping (`_verify_plan_access` and query filtering matching `{"coach_id": coach_id}`), raising HTTP 403 Forbidden if a coach requests an unassigned athlete ID.

**Q6: Why wasn't AI workout recommendation implemented?**  
*A:* AI recommendation is part of our future roadmap. Our primary objective for this milestone was establishing a robust, fully tested full-stack foundation—specifically 94 REST endpoints, 20 database schemas, and multi-role workspace workflows.

---

## 7. Emergency Failure Recovery Checklist

| Failure Symptom | Immediate Root Cause | Emergency Action |
| :--- | :--- | :--- |
| **Frontend page fails to load** | Expo web dev server stopped | Run `npx expo start --web` in `frontend/` directory. |
| **API request returns 500 / Connection Refused** | FastAPI server crashed or port blocked | Run `python -m uvicorn backend.main:app --reload` in `backend/`. |
| **Database error / query timeout** | MongoDB service offline | Run `sudo systemctl start mongod` or verify local Mongo port `27017`. |
| **JWT 401 Unauthorized Error** | Stale / Expired token in storage | Click "Logout", clear browser storage, and log in fresh. |
| **UI component displaying old state** | Web browser caching issue | Hard refresh browser tab (`Ctrl + Shift + R` / `Cmd + Shift + R`). |
| **Missing Demo Data** | Database reset / empty collection | Log in with pre-seeded master account `admin.demo@athlitech.com`. |

---

## 8. Demo Closing Statement (30–45 Seconds)

> *"In conclusion, AthliTech successfully delivers a functional full-stack prototype for athlete performance management. We have engineered a 94-endpoint REST API, 20 MongoDB collections, robust JWT/RBAC security, and an intuitive multi-role workspace architecture—all verified with 100% passing tests. This project establishes the complete digital foundation required for future extensions like AI-driven performance prediction and real-time biometric streaming. Thank you, and I am happy to take any questions."*

---

## 9. One-Page Presenter Demo Cheat Sheet

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ATHLITECH LIVE DEMO CHEAT SHEET                      │
├────┬──────────────────────┬────────────────────────────────────────────┤
│ Step│ Action / Screen      │ Spoken Focus / Key Feature                 │
├────┼──────────────────────┼────────────────────────────────────────────┤
│ 1. │ Landing Page         │ Problem statement & multi-tenant vision    │
│ 2. │ Athlete Register     │ Bcrypt hashing & dual-write to accounts    │
│ 3. │ Athlete Login        │ JWT Bearer token & HttpOnly refresh cookie │
│ 4. │ Profile Completion   │ Profile metadata & immediate feature unlock│
│ 5. │ Athlete Dashboard    │ Summary widgets & Today's Training view    │
│ 6. │ Workout Library      │ Asynchronous sport/category search filters │
│ 7. │ Execute Workout      │ Live session state (Start/Pause/Complete)  │
│ 8. │ Log Performance      │ Metric set logging & PR calculation        │
│ 9. │ Role Hub             │ Single account identity & workspace roles  │
│ 10.│ Coach Workspace      │ Roster discovery & periodized plan builder │
│ 11.│ Assign Workout       │ Coach-athlete plan assignment scoping      │
│ 12.│ Admin Dashboard      │ User management & custom role permissions  │
│ 13.│ Organization        │ Org creation & secure link generation      │
│ 14.│ Architecture / Q&A   │ 22/22 Pytest passed & 7-tier architecture  │
└────┴──────────────────────┴────────────────────────────────────────────┘
```

---

## Final Verification & Compliance Report

* **A. Screens & Workflows Verified**: Verified 1:1 against current Expo web routes (`/`, `/register`, `/login`, `/complete-profile`, `/athlete-dashboard`, `/workout-library`, `/workout-session`, `/role-hub`, `/coach-dashboard`, `/dashboard`, `/organization`).
* **B. Endpoints Verified**: Verified against [API_DOCUMENTATION.md](file:///home/vishwesh/athlitech-app/docs/API_DOCUMENTATION.md).
* **C. Workflows Verified**: Verified against [END_TO_END_WORKFLOWS.md](file:///home/vishwesh/athlitech-app/docs/END_TO_END_WORKFLOWS.md).
* **D. Authentication & RBAC Verified**: Verified against [AUTHENTICATION_RBAC.md](file:///home/vishwesh/athlitech-app/docs/AUTHENTICATION_RBAC.md).
* **E. Discrepancies**: None.
* **F. Unimplemented Claims**: Unimplemented AI, WebSockets, and Stripe payments are explicitly excluded from live demo steps.

**"Demo script verified against the current application workflow with no identified demonstration inaccuracies."**
