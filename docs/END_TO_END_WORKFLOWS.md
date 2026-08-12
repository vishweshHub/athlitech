# AthliTech Final End-to-End Workflow Documentation

> **Status:** Final Frozen Codebase Verification  
> **Target Application:** AthliTech Full-Stack Application (React Native / Expo + FastAPI + MongoDB)  
> **Source Documents Cross-Verified:**  
> - [DATABASE_ARCHITECTURE.md](file:///home/vishwesh/athlitech-app/docs/DATABASE_ARCHITECTURE.md)  
> - [API_DOCUMENTATION.md](file:///home/vishwesh/athlitech-app/docs/API_DOCUMENTATION.md)  
> - [AUTHENTICATION_RBAC.md](file:///home/vishwesh/athlitech-app/docs/AUTHENTICATION_RBAC.md)

---

## 1. Overall Application Journey

The complete AthliTech end-to-end user journey follows a 9-stage lifecycle:

```
[1. Landing Page] ──► [2. Registration / Login] ──► [3. Profile Completion]
                                                            │
                                                            ▼
[6. Role Dashboard] ◄── [5. Role Hub] ◄── [4. Workspace / Role Resolution]
        │
        ├──► [7. Feature Usage] (Workouts, Plans, Assignments)
        ├──► [8. Data Persistence] (MongoDB Motor Async)
        └──► [9. Performance & Activity Tracking] (Activity Feed & Performance Logs)
```

1. **Landing Page**: Public hero view introducing AthliTech sports performance platform with links to Sign Up, Log In, and Role Showcases.
2. **Registration / Login**: User creates an account or authenticates credentials via bcrypt validation and receives JWT Bearer token + HttpOnly refresh cookie.
3. **Profile Completion**: First-time users complete role-specific profile metadata (Athlete: sport, event, height, weight, goals; Coach: primary sport, specialization, experience).
4. **Workspace / Role Resolution**: Backend inspects `role_profiles` and `memberships` collections to calculate active user entitlements.
5. **Role Hub**: Central workspace management screen (`/role-hub`) where multi-role accounts can view, activate, or switch between operational workspace roles (Athlete, Coach, Organization).
6. **Role-Specific Dashboard**: Dynamic dashboard rendering role-tailored metrics (Athlete: today's workout & recent PRs; Coach: athlete roster & activity feed; Admin: user counts & org metrics).
7. **Feature Usage**: Execution of core domain workflows—browsing workout templates, building periodized training plans, assigning workouts, running live workout sessions, and generating invitation links.
8. **Data Persistence**: Asynchronous non-blocking persistence to 20 MongoDB collections via Python Motor repositories.
9. **Performance / Activity Tracking**: Recording workout metric logs, computing personal records (PRs), and publishing timeline updates to the athlete activity feed.

---

## 2. New Athlete Journey

A detailed step-by-step breakdown of an athlete user from initial registration to logging performance metrics:

### Step 1: Account Registration
* **USER ACTION**: Fills out registration form on `/register` (Name, Email, Password, Role: Athlete) and clicks "Create Account".
* **SYSTEM ACTION**: Frontend posts payload to `POST /auth/register`. Backend hashes password with bcrypt, inserts document into `users`, dual-writes to `accounts`, creates `role_profiles` (athlete type), creates `memberships` (default org), and creates an `athletes` domain record.
* **DATA**: Created: `users`, `accounts`, `role_profiles`, `memberships`, `athletes`.
* **API**: `POST /auth/register` (Verified in [auth_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/auth_routes.py)).

### Step 2: Authentication & Token Storage
* **USER ACTION**: Submits credentials on `/login`.
* **SYSTEM ACTION**: Frontend posts to `POST /auth/login`. Backend verifies bcrypt hash, returns `access_token` in JSON, and sets `refresh_token` HttpOnly cookie. Frontend executes `storeToken()`, saving access token to `localStorage` (Web) or `Expo.SecureStore` (Mobile).
* **DATA**: Read: `users`. Created: JWT Access Token & Refresh Cookie.
* **API**: `POST /auth/login` (Verified in [auth_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/auth_routes.py)).

### Step 3: Complete Athlete Profile
* **USER ACTION**: Navigates to `/complete-profile`, enters sport ("Sprinting"), event ("100m"), height, weight, personal bests, and primary goals, then clicks "Complete Profile".
* **SYSTEM ACTION**: Frontend calls `POST /profile/complete`. Backend updates `profiles`, `role_profiles.athlete_data`, and `athletes` documents, setting `profile_completed: true`.
* **DATA**: Updated: `profiles`, `role_profiles`, `athletes`, `users.profile_completed`.
* **API**: `POST /profile/complete` (Verified in [profile_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/profile_routes.py)).

### Step 4: Workspace Resolution & Feature Unlock
* **USER ACTION**: Redirected automatically to `/athlete-dashboard`.
* **SYSTEM ACTION**: Frontend `WorkspaceContext` invokes `fetchRoleHubStatus()`, receiving active roles (`['athlete']`). Restores `currentWorkspace = 'athlete'` and unlocks dashboard features.
* **DATA**: Read: `role_profiles`, `memberships`.
* **API**: `GET /role-profiles/status` & `GET /auth/me` (Verified in [role_profile_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/role_profile_routes.py)).

### Step 5: Browse & Search Workout Library
* **USER ACTION**: Navigates to `/workout-library`, selects sport filter "Sprinting", category "Speed", and types "Acceleration" into search bar.
* **SYSTEM ACTION**: Frontend calls `GET /workouts?sport=Sprinting&category=Speed&search=Acceleration`. Backend queries `workouts` collection for public templates and returns `List[WorkoutResponse]`.
* **DATA**: Read: `workouts`.
* **API**: `GET /workouts` (Verified in [workout_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_routes.py)).

### Step 6: Bookmark / Add Workout to My Workouts
* **USER ACTION**: Clicks "Save to My Workouts" on a workout template card.
* **SYSTEM ACTION**: Frontend calls `POST /athletes/me/saved-workouts` with `workout_template_id`. Backend inserts document into `athlete_saved_workouts` collection.
* **DATA**: Created: `athlete_saved_workouts`.
* **API**: `POST /athletes/me/saved-workouts` (Verified in [athlete_saved_workout_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/athlete_saved_workout_routes.py)).

### Step 7: Start Live Workout Session
* **USER ACTION**: Selects a workout from Today's Training or My Workouts and clicks "Start Workout".
* **SYSTEM ACTION**: Frontend calls `POST /workout-sessions/start` with `assignment_id` or `workout_template_id`. Backend creates `workout_sessions` document (`status: "in_progress"`, `started_at`).
* **DATA**: Created: `workout_sessions`.
* **API**: `POST /workout-sessions/start` (Verified in [workout_session_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_session_routes.py)).

### Step 8: Pause / Resume Workout Session
* **USER ACTION**: Clicks "Pause" button during workout, then clicks "Resume".
* **SYSTEM ACTION**: Frontend calls `POST /workout-sessions/{id}/pause` (updates `status: "paused"`, `paused_at`), followed by `POST /workout-sessions/{id}/resume` (updates `status: "in_progress"`, `resumed_at`).
* **DATA**: Updated: `workout_sessions`.
* **API**: `POST /workout-sessions/{id}/pause` & `POST /workout-sessions/{id}/resume` (Verified in [workout_session_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_session_routes.py)).

### Step 9: Log Exercise Performance Metrics
* **USER ACTION**: Enters sprint time (10.5s), perceived effort (RPE 8), and set notes on the exercise card, then clicks "Log Set".
* **SYSTEM ACTION**: Frontend calls `POST /performance-logs`. Backend calculates whether the score is a personal record, inserts entry into `performance_logs` collection, and updates activity feed.
* **DATA**: Created: `performance_logs`.
* **API**: `POST /performance-logs` (Verified in [performance_log_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/performance_log_routes.py)).

### Step 10: Complete Workout Session
* **USER ACTION**: Clicks "Complete Workout Session" on `/workout-session`.
* **SYSTEM ACTION**: Frontend calls `POST /workout-sessions/{id}/complete` with duration and completion rating. Backend updates `workout_sessions` document (`status: "completed"`, `completed_at`, `total_duration_seconds`).
* **DATA**: Updated: `workout_sessions`.
* **API**: `POST /workout-sessions/{id}/complete` (Verified in [workout_session_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_session_routes.py)).

---

## 3. Athlete Workout Terminology & Lifecycle

AthliTech strictly differentiates five distinct workout lifecycle entities:

```
[Workout Template] ──► (Saved by Athlete) ──► [Athlete Saved Workout]
       │
       ├──► (Assigned by Coach to Plan Session) ──► [Workout Assignment]
                                                         │
                                                         ▼
[Performance Log] ◄── (Logged Metrics) ◄── [Workout Session Execution]
```

1. **Workout Template (`workouts` collection)**: Reusable master workout definition created by coaches or admins (`title`, `sport`, `category`, `difficulty`, `instructions`, `equipment`). Publicly readable.
2. **Saved / My Workout (`athlete_saved_workouts` collection)**: Athlete's personal bookmark referencing a `workout_template_id`.
3. **Workout Assignment (`workout_assignments` collection)**: An instance mapping a `workout_template_id` to a specific scheduled `session_id` within a periodized training plan, containing custom order position and parameter overrides.
4. **Workout Session (`workout_sessions` collection)**: Active execution state container tracking real-time status (`"not_started"`, `"in_progress"`, `"paused"`, `"completed"`), start/completion timestamps, and total elapsed duration.
5. **Performance Log (`performance_logs` collection)**: Discrete metric datapoints recorded during a workout execution (`activity_label`, `metrics: {sprint_time: 10.5, rpe: 8}`, `is_personal_record`).

---

## 4. Coach Journey

1. **Login & Workspace Switch**: Coach logs in (`POST /auth/login`) and opens Coach Dashboard (`/coach-dashboard`).
2. **Roster Oversight**: Navigates to "My Athletes" (`GET /coaches/{coach_id}/athletes`), viewing assigned athletes, sport disciplines, and activity status.
3. **Athlete Inspection**: Clicks on an athlete to view detailed profile (`GET /athletes/{athlete_id}`), historical performance logs (`GET /performance-logs/athlete/{athlete_id}`), and summary metrics (`GET /dashboard/athlete/{athlete_id}/summary`).
4. **Workout Assignment Workflow**:
   * Coach opens Training Plan manager and creates a plan for the athlete (`POST /training-plans/`).
   * Creates training weeks (`POST /training-plans/weeks/`), days (`POST /training-plans/days/`), and sessions (`POST /training-plans/sessions/`).
   * Selects a template from Workout Library (`GET /workouts`) and creates an assignment (`POST /training-plans/assignments/`) linking `workout_template_id` to the athlete's plan `session_id`.
5. **Monitoring & Feedback**: Coach monitors athlete completion rates via dashboard activity feed (`GET /activity-feed`) and logs legacy coach feedback (`POST /performances/`).

---

## 5. Coach → Athlete Workout Assignment Flow (Technical Sequence)

```
[Coach UI] ──1. Selects Athlete & Workout Template──► [FastAPI Route]
                                                           │
                                                           ▼
[workout_assignment_service.py] ◄──2. POST /training-plans/assignments/
              │
              ├──► 3. Verifies Template exists (workout_repository)
              ├──► 4. Verifies Plan Access (training_plan_service._verify_plan_access)
              │       (Ensures athlete is assigned to coach via athletes.coach_id)
              └──► 5. Prevents duplicate order conflict in session
              │
              ▼
[workout_assignment_repository.py] ──6. insert_one()──► [db["workout_assignments"]]
                                                                │
                                                                ▼
[Athlete UI] ◄──7. GET /training/today ──────────────────────────┤
      │
      ▼
[Athlete Starts Workout] ──► POST /workout-sessions/start ──► db["workout_sessions"]
      │
      ▼
[Athlete Logs Set] ────────► POST /performance-logs ───────► db["performance_logs"]
      │
      ▼
[Coach UI] ◄──8. GET /performance-logs/athlete/{athlete_id} ────┘
```

* **Verified Endpoints**:
  * `POST /training-plans/assignments/` ([workout_assignment_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_assignment_routes.py))
  * `GET /training/today` ([today_training_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/today_training_routes.py))
  * `POST /workout-sessions/start` ([workout_session_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_session_routes.py))
  * `POST /performance-logs` ([performance_log_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/performance_log_routes.py))
  * `GET /performance-logs/athlete/{athlete_id}` ([performance_log_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/performance_log_routes.py))

---

## 6. Admin Journey

1. **Admin Authentication**: Admin logs in (`POST /auth/login`) with `admin` role credentials.
2. **Admin Dashboard Oversight**: Navigates to `/dashboard` to view platform overview metrics (`GET /dashboard/admin/summary`), total user counts, active organizations, and system health.
3. **User Management**: Opens User Management (`GET /users/`), filters users by role or search string, updates user roles (`PUT /users/{user_id}/role`), and deletes non-admin user accounts (`DELETE /users/{user_id}`).
4. **Role Management**: Opens Role Management (`GET /roles/`), creates custom system roles (`POST /roles/`), updates role permission lists (`PUT /roles/{role_name}/permissions`), and deletes custom roles (`DELETE /roles/{role_name}`).
5. **Global Metric Registry**: Registers global athletic metrics (`POST /metric-definitions`) used platform-wide.

---

## 7. Multi-Role Workspace Flow

AthliTech allows a single user account to possess and switch between multiple active operational workspaces (`athlete`, `coach`, `organization`) without logging out:

```
[Single Account Identity] (account_id / email)
       │
       ▼
GET /role-profiles/status ──► Returns Active Status per Role
       │
       ├───────► Athlete Role Active? ──────► Unlock Athlete Workspace
       ├───────► Coach Role Active? ────────► Unlock Coach Workspace
       └───────► Organization Role Active? ─► Unlock Organization Workspace
       │
POST /role-profiles/activate ──► Activates new role profile dynamically
       │
WorkspaceContext.tsx ──► setCurrentWorkspace('coach') ──► Navigate to /coach-dashboard
```

### Key Multi-Role Architecture Principles
* **Single Identity**: User maintains one email, one password hash, and one primary `account_id`.
* **Role Profiles (`role_profiles` collection)**: Holds role-specific metadata (`athlete_data` vs `coach_data` vs `admin_data`).
* **Role Activation (`POST /role-profiles/activate`)**: Dynamically provisions missing profile and membership documents on demand.
* **Workspace Switching (`WorkspaceContext.tsx`)**: Controls active UI routing between `/athlete-dashboard`, `/coach-dashboard`, and `/dashboard` using `currentWorkspace` state.

---

## 8. Organization Workflow

1. **Organization Creation**: User submits organization setup on `/mock-checkout` or `/organization` (`POST /organization/create`), providing `name`, `org_type`, `sport`, `country`, `timezone`, and `plan_tier`.
2. **Persistence**: Backend inserts document into `organizations`, creates `role_profiles` (type `organization`), creates `memberships` (role `owner`), and inserts subscription quota into `subscriptions`.
3. **Organization Management**: Owner views organization details (`GET /organization/my-organization`) and updates plan tier (`PUT /organization/my-organization/plan`).
4. **Invitation Generation**: Owner generates invitation links (`POST /organization/my-organization/invitations`) specifying invitee email and target role (`coach` / `athlete`). Server returns secure invitation URL (`https://athlitech.app/join?org={org_id}&token={inv_id}`).
5. **Subscription Cancellation**: Owner cancels subscription (`POST /organization/my-organization/subscription/cancel`), setting subscription status to `cancelled` and role profile to `inactive`.

---

## 9. Registration → First Use Flow & Immediate Feature Unlock

```
[POST /auth/register] ──► Creates User & Dual-Writes Account
                                 │
                                 ▼
[POST /auth/login] ──► Returns Access Token & Sets Refresh Cookie
                                 │
                                 ▼
[POST /profile/complete] ──► Sets profile_completed = True
                                 │
                                 ▼
[WorkspaceContext Refresh] ──► fetchRoleHubStatus() ──► activeRoles: ['athlete']
                                 │
                                 ▼
[Immediate Feature Unlock] ──► Enables Workout Library, Today's Training & Session Logging
```

Upon saving profile details (`POST /profile/complete`), AthliTech immediately marks `profile_completed: true` and resolves active workspace roles in `WorkspaceContext`. The UI instantly unlocks core dashboard navigation, workout library features, and session execution screens without requiring manual user logouts or re-authentication.

---

## 10. End-to-End Data Flow Through the Application

### Pipeline Architecture
```
[User Action in React Component]
       │
       ▼
[Frontend API Module] (frontend/src/api/*.ts)
       │ (Attaches Authorization: Bearer <token>)
       ▼
[HTTP Request] ──► [FastAPI Route] (backend/routes/*.py)
                         │
                         ▼
           [get_current_user Dependency] (Decodes JWT & verifies active_roles)
                         │
                         ▼
           [Pydantic Validation] (backend/schemas/*.py)
                         │
                         ▼
           [Service Layer] (backend/services/*.py) (Business logic & scoping)
                         │
                         ▼
           [Repository Layer] (backend/repositories/*.py) (ObjectId parsing)
                         │
                         ▼
           [MongoDB Motor Async] (backend/database/mongodb.py)
                         │
                         ▼
           [JSON Response] ──► [Frontend React State Update] ──► [UI Re-render]
```

### Detailed Example: Workout Assignment
1. **User Action**: Coach clicks "Assign Workout" in plan manager.
2. **Frontend API**: `workout.ts` calls `fetch('/training-plans/assignments/', { method: 'POST', headers: { Authorization: 'Bearer ...' }, body: JSON.stringify(payload) })`.
3. **FastAPI Route**: `workout_assignment_routes.py` matches `POST /training-plans/assignments/`.
4. **Authentication**: `get_current_user` extracts JWT, verifies coach user identity, and resolves active roles.
5. **Permission & Validation**: Route dependency verifies coach permissions; Pydantic validates `WorkoutAssignmentCreate` schema.
6. **Service**: `workout_assignment_service.create_assignment()` calls `_verify_session_access()` and confirms template exists.
7. **Repository**: `workout_assignment_repository.create_assignment()` calls `db["workout_assignments"].insert_one(doc)`.
8. **MongoDB**: Motor inserts document into `athlitech.workout_assignments` collection.
9. **Response & UI Update**: Returns `WorkoutAssignmentResponse` JSON; React updates plan UI state.

---

## 11. Error / Failure Flow

AthliTech replaces silent failures with structured error handling:

```
[HTTP Request] ──► [FastAPI / Service Raises Exception] (400, 401, 403, 404, 422, 500)
                                 │
                                 ▼
                     [FastAPI Detail Error JSON]
                                 │
                                 ▼
[Frontend handleResponse()] ──► Format Message via ApiError.ts
                                 │
                                 ▼
                      [Throws Structured ApiError]
                                 │
                                 ▼
[React UI Component Catch] ──► Renders User-Facing Alert Banner / Error Dialog
```

* **Error Utility**: `formatApiDetailMessage()` and `parseApiErrorMessage()` in [frontend/src/utils/ApiError.ts](file:///home/vishwesh/athlitech-app/frontend/src/utils/ApiError.ts) parse raw FastAPI validation arrays (`detail: [{loc: [...], msg: "..."}]`) and map field errors into readable bullet points (e.g., `• RPE is required and must be between 1 and 10`).
* **Structured Exception**: Throws `ApiError` instance containing `message`, HTTP `status`, and `code`.
* **User Feedback**: UI components display error messages directly in inline warning banners rather than silently failing or crashing.

---

## 12. Responsive Experience

AthliTech implements dynamic layout adaptation across viewports:

* **Desktop (≥ 1024px)**: Full multi-column grid layouts (Workout Library 3-column cards, 2-column dashboard widgets), persistent side navigation bar, expanded data tables.
* **Tablet (768px – 1023px)**: 2-column card layouts, adaptive side-drawer navigation, flexible form field stacks.
* **Mobile (< 768px)**: Single-column stacked layouts, collapsible drawer navigation, touch-optimized button targets, scrollable card lists.

---

## 13. Complete Product Flow Diagram

```
                              ┌────────────────────────┐
                              │      LANDING PAGE      │
                              └───────────┬────────────┘
                                          │
                              ┌───────────┴────────────┐
                              │  REGISTRATION / LOGIN  │
                              └───────────┬────────────┘
                                          │
                              ┌───────────┴────────────┐
                              │   PROFILE COMPLETION   │
                              └───────────┬────────────┘
                                          │
                              ┌───────────┴────────────┐
                              │   ROLE HUB WORKSPACE   │
                              └───────────┬────────────┘
                                          │
       ┌──────────────────────────────────┼──────────────────────────────────┐
       ▼                                  ▼                                  ▼
┌──────────────┐                   ┌──────────────┐                   ┌──────────────┐
│   ATHLETE    │                   │    COACH     │                   │    ADMIN     │
│  DASHBOARD   │                   │  DASHBOARD   │                   │  DASHBOARD   │
└──────┬───────┘                   └──────┬───────┘                   └──────┬───────┘
       │                                  │                                  │
       ├── Workout Library                ├── Athlete Rosters                ├── User Admin
       ├── Today's Training               ├── Plan Construction              ├── Custom Roles
       ├── Live Execution                 ├── Workout Assignment             ├── Metric Registry
       └── Performance Logs               └── Activity Feed                  └── Platform Metrics
```

---

## 14. Workflow State Transitions

### User Account State
`Registered` → `Profile Completed` → `Workspace Active` → `Role Switchable`

### Role Workspace State
`Available` → `Active` (`POST /role-profiles/activate`) ↔ `Inactive` (`POST /role-profiles/deactivate`)

### Workout Session Execution State
`not_started` → `in_progress` (`/start`) ↔ `paused` (`/pause` / `/resume`) → `completed` (`/complete`) / `cancelled` (`/cancel`)

### Organization State
`Created` → `Subscription Active` → `Members Invited` → `Subscription Cancelled`

---

## 15. Mentor Review Q&A

**Q: What happens when a new athlete registers?**  
*A:* Backend creates documents in `users`, `accounts`, `role_profiles` (athlete type), `memberships`, and `athletes` collections. The user receives JWT tokens and completes their athlete profile.

**Q: How does an athlete unlock dashboard features?**  
*A:* Completing the profile sets `profile_completed: true`. `WorkspaceContext` refreshes workspace status (`GET /role-profiles/status`), resolves `activeRoles`, and unlocks dashboard navigation.

**Q: How does a workout move from library to execution?**  
*A:* A coach assigns a workout template (`workouts`) to a plan session (`workout_assignments`). The athlete sees it in Today's Training (`GET /training/today`) and clicks "Start Workout", creating a live `workout_sessions` document.

**Q: What happens when an athlete completes a workout?**  
*A:* The athlete logs performance metrics (`POST /performance-logs`), and clicks complete (`POST /workout-sessions/{id}/complete`), updating session status to `completed` and recording elapsed duration.

**Q: How does a coach assign a workout to an athlete?**  
*A:* Coach creates a training plan for an assigned athlete, selects a template from Workout Library, and calls `POST /training-plans/assignments/` to link the template to a plan session.

**Q: How does workspace switching work?**  
*A:* Single account identity calls `POST /role-profiles/activate` to enable new roles. `WorkspaceContext.tsx` manages `currentWorkspace` state, allowing switching between Athlete, Coach, and Org views without logging out.

---

## Final Verification & Compliance Report

* **A. Workflows Documented**: All 9 major user journeys documented (Landing, Registration, Athlete, Coach, Admin, Multi-Role, Organization, Data Flow, Error Handling).
* **B. APIs Verified**: Verified 100% against [API_DOCUMENTATION.md](file:///home/vishwesh/athlitech-app/docs/API_DOCUMENTATION.md) and backend route definitions.
* **C. Database Flows Verified**: Verified against [DATABASE_ARCHITECTURE.md](file:///home/vishwesh/athlitech-app/docs/DATABASE_ARCHITECTURE.md) and Motor repositories.
* **D. Authentication/RBAC Verified**: Verified against [AUTHENTICATION_RBAC.md](file:///home/vishwesh/athlitech-app/docs/AUTHENTICATION_RBAC.md).
* **E. Discrepancies**: None.
* **F. Unverified Claims**: AI generation, WebSockets, and Stripe live payments are confirmed as non-implemented and excluded.

**"End-to-end workflow documentation verified against the current codebase with no identified workflow inaccuracies."**
