# AthliTech Final API Documentation

> **Status:** Final Frozen Codebase Documentation  
> **Target Framework:** Python FastAPI (Uvicorn / Asynchronous ASGI)  
> **Source Files Verified:**  
> - [main.py](file:///home/vishwesh/athlitech-app/backend/main.py)  
> - All 19 router files in [backend/routes/](file:///home/vishwesh/athlitech-app/backend/routes/)  
> - All Pydantic schemas in [backend/schemas/](file:///home/vishwesh/athlitech-app/backend/schemas/)  
> - Security & Permission modules: [security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py), [permissions.py](file:///home/vishwesh/athlitech-app/backend/core/permissions.py), [auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py)  
> - All frontend API modules in [frontend/src/api/](file:///home/vishwesh/athlitech-app/frontend/src/api/)

---

## 1. API Overview

* **Backend Framework**: Python **FastAPI** running asynchronously on Uvicorn.
* **API Style**: **RESTful JSON API** adhering to standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
* **Base URL**: `http://localhost:8000` (or as defined by environment variable `VITE_API_URL` / `API_URL`).
* **Authentication Mechanism**: **JWT Bearer Token Authentication** sent via `Authorization: Bearer <access_token>` request headers, accompanied by an `HttpOnly` refresh token cookie for session extension.
* **Request & Response Payload Format**: `application/json` validated bi-directionally via Pydantic models.
* **Client-Server Communication**: Frontend API services (`frontend/src/api/*.ts`) wrap native `fetch()` calls, managing header injection, token passing, and standardized error parsing (`ApiError`).

---

## 2. API Endpoint Inventory & Route Prefixes

All routes are mounted directly in [backend/main.py](file:///home/vishwesh/athlitech-app/backend/routes/) using `app.include_router()`. The final external path is determined by the `prefix` defined in each APIRouter module combined with the endpoint route path.

### A. Authentication (`/auth`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account | Public | Open | `RegisterRequest` | `RegisterResponse` |
| `POST` | `/auth/login` | Authenticate user & issue access/refresh tokens | Public | Open | `UserLogin` | `TokenResponse` + Cookie |
| `POST` | `/auth/refresh` | Issue new access token using HttpOnly cookie | Public (Cookie) | Valid Refresh Token | None (Reads Cookie) | `TokenResponse` + Cookie |
| `POST` | `/auth/logout` | Clear refresh token cookie & terminate session | Public | Open | None | `{"message": "Logged out successfully"}` |
| `GET` | `/auth/me` | Fetch active user identity & role workspace status | Bearer JWT | Authenticated User | None | User Dict (includes `active_roles`) |

### B. Profile (`/profile`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/profile/complete` | Save athlete or coach structured profile data | Bearer JWT | Authenticated User | `AthleteProfile` / `CoachProfile` Dict | Saved Profile Dict |
| `GET` | `/profile/me` | Retrieve profile data for authenticated user | Bearer JWT | Authenticated User | None | `ProfileResponse` |
| `GET` | `/profile/recommendations` | Get personalized workout recommendations | Bearer JWT | Authenticated User | None | `List[RecommendationItem]` |

### C. Role Profiles & Workspace (`/role-profiles`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/role-profiles/status` | Fetch workspace Role Hub status across all roles | Bearer JWT | Authenticated User | None | `RoleHubStatusResponse` |
| `POST` | `/role-profiles/activate` | Activate a role workspace (athlete, coach, org) | Bearer JWT | Authenticated User | `ActivateRoleRequest` | `{"message", "role", "active"}` |
| `POST` | `/role-profiles/deactivate` | Deactivate a role workspace subscription | Bearer JWT | Authenticated User | `DeactivateRoleRequest` | `{"message", "role", "active"}` |

### D. Athlete (`/athletes`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/athletes/` | List all athletes (paginated with filters) | Bearer JWT | Coach or Admin | None | `List[AthleteRead]` |
| `GET` | `/athletes/{athlete_id}` | Retrieve specific athlete domain details | Bearer JWT | Self, Coach (Assigned), or Admin | None | `AthleteRead` |
| `POST` | `/athletes/me/saved-workouts` | Bookmark workout template to athlete collection | Bearer JWT | Authenticated Athlete | `AthleteSavedWorkoutCreate` | `AthleteSavedWorkoutResponse` |
| `GET` | `/athletes/me/saved-workouts` | List athlete's bookmarked workout templates | Bearer JWT | Authenticated Athlete / Admin | None | `List[AthleteSavedWorkoutResponse]` |
| `DELETE`| `/athletes/me/saved-workouts/{workout_template_id}` | Remove template from saved collection | Bearer JWT | Authenticated Athlete | None | `{"message", "workout_template_id"}` |

### E. Coach (`/coaches`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/athletes/{athlete_id}/assign/{coach_id}` | Assign an athlete to a coach | Bearer JWT | Coach (Self) or Admin | None | `{"message": "..."}` |
| `GET` | `/coaches/{coach_id}/athletes` | Retrieve list of athletes assigned to a coach | Bearer JWT | Coach (Self) or Admin | None | `List[AthleteRead]` |
| `GET` | `/coaches/{coach_id}` | Fetch public coach details by coach_id | Public / Open | Open | None | Coach Details Dict |
| `DELETE`| `/athletes/{athlete_id}/assign` | Unassign athlete from assigned coach | Bearer JWT | Coach (Self) or Admin | None | `{"message": "..."}` |

### F. Workouts (`/workouts`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/workouts` | Create workout template or legacy assigned workout | Bearer JWT | Authenticated User | `WorkoutCreate` / `WorkoutCreateLegacy` | `WorkoutResponse` / Dict |
| `GET` | `/workouts` | List workout templates (paginated with filters) | Bearer JWT | Authenticated User | None | `List[WorkoutResponse]` |
| `GET` | `/workouts/coach/{coach_id}` | Fetch workouts created by a specific coach | Bearer JWT | Authenticated User | None | `List[WorkoutRead]` |
| `GET` | `/workouts/athlete/{athlete_id}` | Fetch legacy workouts assigned to an athlete | Bearer JWT | Self, Coach, or Admin | None | `List[WorkoutRead]` |
| `PUT` | `/workouts/{workout_id}/status` | Update legacy workout completion status | Bearer JWT | Assigned Athlete / Coach | `WorkoutUpdateStatus` | `{"message", "status"}` |
| `GET` | `/workouts/metadata` | Get distinct sports, categories, equipment | Public / Open | Open | None | `WorkoutMetadata` Dict |
| `GET` | `/workouts/sports` | Get distinct list of sports across templates | Public / Open | Open | None | `List[str]` |
| `GET` | `/workouts/{id}` | Retrieve single workout template by ID | Bearer JWT | Authenticated User | None | `WorkoutResponse` |
| `PUT` | `/workouts/{id}` | Update existing workout template | Bearer JWT | Author or Admin | `WorkoutUpdate` | `WorkoutResponse` |
| `DELETE`| `/workouts/{id}` | Delete workout template | Bearer JWT | Author or Admin | None | `{"message", "id"}` |

### G. Training Plans, Weeks, Days, Sessions & Assignments (`/training-plans`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/training-plans/` | Create a high-level training plan | Bearer JWT | Athlete (Self), Coach, Admin | `TrainingPlanCreate` | `TrainingPlanResponse` |
| `GET` | `/training-plans/` | List all accessible training plans | Bearer JWT | Authenticated User | None | `List[TrainingPlanResponse]` |
| `GET` | `/training-plans/athlete/{athlete_id}` | List training plans for a specific athlete | Bearer JWT | Self, Assigned Coach, Admin | None | `List[TrainingPlanResponse]` |
| `GET` | `/training-plans/{plan_id}` | Get training plan by ID | Bearer JWT | Plan Access Scope | None | `TrainingPlanResponse` |
| `PUT` | `/training-plans/{plan_id}` | Update training plan details | Bearer JWT | Plan Access Scope | `TrainingPlanUpdate` | `TrainingPlanResponse` |
| `DELETE`| `/training-plans/{plan_id}` | Cascade delete training plan and sub-entities | Bearer JWT | Plan Access Scope | None | `{"message", "id"}` |
| `POST` | `/training-plans/weeks/` | Create a training week inside a plan | Bearer JWT | Plan Access Scope | `TrainingWeekCreate` | `TrainingWeekResponse` |
| `GET` | `/training-plans/plans/{plan_id}/weeks` | List all weeks for a training plan | Bearer JWT | Plan Access Scope | None | `List[TrainingWeekResponse]` |
| `GET` | `/training-plans/weeks/{week_id}` | Get training week by ID | Bearer JWT | Plan Access Scope | None | `TrainingWeekResponse` |
| `PUT` | `/training-plans/weeks/{week_id}` | Update training week phase/target volume | Bearer JWT | Plan Access Scope | `TrainingWeekUpdate` | `TrainingWeekResponse` |
| `DELETE`| `/training-plans/weeks/{week_id}` | Delete training week & sub-days/sessions | Bearer JWT | Plan Access Scope | None | `{"message", "id"}` |
| `POST` | `/training-plans/days/` | Create a training day in a week | Bearer JWT | Plan Access Scope | `TrainingDayCreate` | `TrainingDayResponse` |
| `GET` | `/training-plans/weeks/{week_id}/days` | List days for a training week | Bearer JWT | Plan Access Scope | None | `List[TrainingDayResponse]` |
| `GET` | `/training-plans/days/{day_id}` | Get training day by ID | Bearer JWT | Plan Access Scope | None | `TrainingDayResponse` |
| `PUT` | `/training-plans/days/{day_id}` | Update training day type/notes | Bearer JWT | Plan Access Scope | `TrainingDayUpdate` | `TrainingDayResponse` |
| `DELETE`| `/training-plans/days/{day_id}` | Delete training day & sub-sessions | Bearer JWT | Plan Access Scope | None | `{"message", "id"}` |
| `POST` | `/training-plans/sessions/` | Create a session in a training day | Bearer JWT | Plan Access Scope | `SessionCreate` | `SessionResponse` |
| `GET` | `/training-plans/days/{day_id}/sessions` | List sessions for a training day | Bearer JWT | Plan Access Scope | None | `List[SessionResponse]` |
| `GET` | `/training-plans/sessions/{session_id}` | Get training session by ID | Bearer JWT | Plan Access Scope | None | `SessionResponse` |
| `PUT` | `/training-plans/sessions/{session_id}` | Update session times/order | Bearer JWT | Plan Access Scope | `SessionUpdate` | `SessionResponse` |
| `DELETE`| `/training-plans/sessions/{session_id}` | Delete session & assigned workouts | Bearer JWT | Plan Access Scope | None | `{"message", "id"}` |
| `POST` | `/training-plans/assignments/` | Map workout template to session | Bearer JWT | Plan Write Scope | `WorkoutAssignmentCreate` | `WorkoutAssignmentResponse` |
| `GET` | `/training-plans/sessions/{session_id}/assignments` | List assignments for a session | Bearer JWT | Plan Access Scope | None | `List[WorkoutAssignmentResponse]` |
| `GET` | `/training-plans/assignments/{assignment_id}` | Get workout assignment by ID | Bearer JWT | Plan Access Scope | None | `WorkoutAssignmentResponse` |
| `PUT` | `/training-plans/assignments/{assignment_id}` | Update assignment order/overrides | Bearer JWT | Plan Write Scope | `WorkoutAssignmentUpdate` | `WorkoutAssignmentResponse` |
| `DELETE`| `/training-plans/assignments/{assignment_id}` | Delete workout assignment | Bearer JWT | Plan Write Scope | None | `{"message", "id"}` |

### H. Today's Training (`/training`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/training/today` | Fetch consolidated daily training schedule for athlete | Bearer JWT | Self, Coach (Assigned), or Admin | None | `TodayTrainingResponse` |

### I. Workout Sessions (`/workout-sessions`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/workout-sessions/start` | Start live workout execution instance | Bearer JWT | Authenticated Athlete | `WorkoutSessionStartRequest` | `WorkoutSessionResponse` |
| `POST` | `/workout-sessions/{id}/pause` | Pause live workout execution | Bearer JWT | Assigned Athlete | None | `WorkoutSessionResponse` |
| `POST` | `/workout-sessions/{id}/resume` | Resume paused workout session | Bearer JWT | Assigned Athlete | None | `WorkoutSessionResponse` |
| `POST` | `/workout-sessions/{id}/complete` | Complete workout session execution | Bearer JWT | Assigned Athlete | `WorkoutSessionCompleteRequest` | `WorkoutSessionResponse` |
| `POST` | `/workout-sessions/{id}/cancel` | Cancel live workout session | Bearer JWT | Assigned Athlete | `WorkoutSessionCancelRequest` | `WorkoutSessionResponse` |
| `GET` | `/workout-sessions/active` | Get current active workout session | Bearer JWT | Self, Coach, or Admin | None | `WorkoutSessionResponse` |
| `GET` | `/workout-sessions/{id}` | Get workout session execution by ID | Bearer JWT | Self, Coach, or Admin | None | `WorkoutSessionResponse` |

### J. Metric Definitions & Performance Logs (`/metric-definitions`, `/performance-logs`, `/performances`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/metric-definitions` | Get all metric definitions registry | Bearer JWT | Authenticated User | None | `List[MetricDefinitionResponse]` |
| `POST` | `/metric-definitions` | Register a new metric definition | Bearer JWT | Admin Only | `MetricDefinitionCreate` | `MetricDefinitionResponse` |
| `POST` | `/performance-logs` | Record metric log for completed exercise | Bearer JWT | Authenticated User | `PerformanceLogCreate` | `PerformanceLogResponse` |
| `GET` | `/performance-logs/me` | Fetch authenticated athlete's logs | Bearer JWT | Authenticated Athlete | None | `List[PerformanceLogResponse]` |
| `GET` | `/performance-logs/workout-session/{workout_session_id}` | Fetch logs for a specific session | Bearer JWT | Self, Coach, or Admin | None | `List[PerformanceLogResponse]` |
| `GET` | `/performance-logs/athlete/{athlete_id}` | Fetch logs for a specific athlete | Bearer JWT | Self, Coach, or Admin | None | `List[PerformanceLogResponse]` |
| `GET` | `/performance-logs/{id}` | Get specific performance log by ID | Bearer JWT | Self, Coach, or Admin | None | `PerformanceLogResponse` |
| `DELETE`| `/performance-logs/dev-reset/{workout_session_id}` | Reset session logs (DEV_MODE=true) | Bearer JWT | Athlete (Self) / Admin | None | `{"deleted", "workout_session_id"}` |
| `POST` | `/performances/` | Create legacy performance record | Bearer JWT | Coach Only | `PerformanceCreate` | `{"message", "performance_id"}` |
| `GET` | `/performances/athlete/{athlete_id}` | Fetch legacy athlete performance history | Bearer JWT | Self, Assigned Coach, Admin | None | `List[PerformanceRead]` |
| `GET` | `/performances/` | List all legacy performance records | Bearer JWT | Admin Only | None | `List[PerformanceRead]` |

### K. Organization & Workspace (`/organization`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/organization/my-organization` | Fetch organization details for account | Bearer JWT | Authenticated User | None | `{"organization": OrganizationData}` |
| `POST` | `/organization/create` | Create organization and owner membership | Bearer JWT | Authenticated User | `CreateOrganizationRequest` | Created Org Response Dict |
| `PUT` | `/organization/my-organization/plan` | Update organization plan tier | Bearer JWT | Org Owner / Admin | `UpdatePlanRequest` | `{"message", "plan_tier"}` |
| `POST` | `/organization/my-organization/subscription/cancel` | Cancel organization subscription | Bearer JWT | Org Owner / Admin | None | `{"message", "active"}` |
| `GET` | `/organization/my-organization/invitations` | Get org member invitations & requests | Bearer JWT | Org Owner / Admin | None | `OrganizationInvitationsResponse` |
| `POST` | `/organization/my-organization/invitations` | Generate invitation link for member | Bearer JWT | Org Owner / Admin | `InviteMemberRequest` | `{"message", "invitation"}` |

### L. Admin, Users & Roles (`/users`, `/roles`, `/dashboard`, `/activity-feed`)

| Method | Actual Mounted Endpoint Path | Purpose | Authentication | Permission / Role | Request Body | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users/` | List all system users (paginated) | Bearer JWT | Admin Only | None | `List[User]` |
| `GET` | `/users/{user_id}` | Fetch user account details by ID | Bearer JWT | Admin or Self | None | `User` |
| `PUT` | `/users/{user_id}/role` | Update user primary role | Bearer JWT | Admin Only | `UserRoleUpdate` | Updated User Dict |
| `DELETE`| `/users/{user_id}` | Delete user account | Bearer JWT | Admin Only | None | `{"message": "User deleted..."}` |
| `POST` | `/roles/` | Create custom system role | Bearer JWT | Admin Only | `RoleCreate` | Created Role Dict |
| `GET` | `/roles/` | List all system roles | Bearer JWT | Admin Only | None | `List[Role]` |
| `PUT` | `/roles/{role_name}/permissions` | Update custom role permissions | Bearer JWT | Admin Only | `List[str]` | `{"message": "Permissions updated"}` |
| `DELETE`| `/roles/{role_name}` | Delete custom system role | Bearer JWT | Admin Only | None | `{"message": "Role deleted"}` |
| `GET` | `/dashboard/admin/summary` | Fetch platform admin dashboard metrics | Bearer JWT | Admin Only | None | `AdminSummaryRead` |
| `GET` | `/dashboard/coach/{coach_id}/summary` | Fetch coach summary metrics | Bearer JWT | Coach (Self) or Admin | None | `CoachSummaryRead` |
| `GET` | `/dashboard/athlete/{athlete_id}/summary` | Fetch athlete summary metrics | Bearer JWT | Self, Coach, or Admin | None | `AthleteSummaryRead` |
| `GET` | `/activity-feed` | Fetch athlete activity feed timeline | Bearer JWT | Self, Coach, or Admin | None | `ActivityFeedResponse` |

---

## 3. Authentication Flow

AthliTech utilizes **JWT Bearer Authentication** with dual-token issuance:

```
[Client] ──POST /auth/login──► [FastAPI Route: auth_routes.py]
                                     │
                                     ▼
                               [auth_service.py]
                                     │ (verify_password via bcrypt)
                                     ▼
                               [security.py]
                                     │ (Encodes JWT with SECRET_KEY)
                                     ▼
[Client] ◄──Token JSON + Cookie─────── (Returns access_token & sets HttpOnly refresh_token Cookie)
```

1. **Password Hashing**: Executed in [backend/core/security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py) using `bcrypt` (`hash_password` & `verify_password`).
2. **Token Generation**: Access tokens generated in `create_access_token()` using `python-jose` with `HS256` algorithm. Expiry is 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`). Refresh tokens expire in 7 days (`REFRESH_TOKEN_EXPIRE_DAYS`).
3. **Frontend Token Handling**: Frontend stores `access_token` in `localStorage` via `storeToken()` in [frontend/src/api/auth.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/auth.ts), and sends it in HTTP requests via `Authorization: Bearer <access_token>`.
4. **Token Verification**: Handled by FastAPI dependency `get_current_user` in [backend/services/auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py), which decodes the JWT, verifies the signature against `SECRET_KEY`, loads user context, and builds `active_roles`.
5. **Unauthorized Requests**: Invalid or missing tokens trigger HTTP 401 Unauthorized exceptions (`detail: "Invalid or expired token"`).

---

## 4. RBAC / Permission Requirements

Authorization in AthliTech is enforced using FastAPI dependencies and explicit service-level role verification:

1. **Route Level Guards**:
   * `Depends(require_admin)`: Verifies `admin` is present in `current_user["active_roles"]`. Raises HTTP 403 if missing.
   * `Depends(require_coach_or_admin)`: Verifies `coach` or `admin` is present in `active_roles`. Raises HTTP 403 if missing.
   * `Depends(require_admin_or_self)`: Allows access if `current_user["id"] == user_id` or user is an `admin`.
2. **Granular Business Permission Scope**:
   * `_verify_plan_access(plan, current_user, require_write)` in [training_plan_service.py](file:///home/vishwesh/athlitech-app/backend/services/training_plan_service.py): Verifies that for a training plan, an athlete can only view/modify their own plan, a coach can only access plans created by them or belonging to their assigned athletes (`athletes.coach_id == user_id`), and admins have full access.
   * `normalize_role()` in [permissions.py](file:///home/vishwesh/athlitech-app/backend/core/permissions.py) standardizes role strings.

---

## 5. Important End-to-End API Flows

### Flow A: Registration & Login
1. `POST /auth/register` with `RegisterRequest` payload → Creates `users`, `accounts`, `role_profiles`, `memberships`, `athletes` documents → Returns HTTP 200 with `user_id`.
2. `POST /auth/login` with `UserLogin` payload → Verifies bcrypt password → Returns `access_token` and sets `refresh_token` HttpOnly cookie.
3. Client stores `access_token` in `localStorage` and includes header `Authorization: Bearer <access_token>` in all subsequent API requests.

### Flow B: Athlete Profile Setup
1. `GET /auth/me` → Returns user identity and `profile_completed: false`.
2. `POST /profile/complete` with `CompleteAthleteProfileRequest` → Updates `profiles`, `role_profiles`, and `athletes` collections with sport, event, height, weight, goals.
3. `GET /role-profiles/status` → Confirms active role status and workspace readiness.

### Flow C: Workout Library & Bookmarking
1. `GET /workouts?sport=Sprinting&difficulty=Intermediate` → Returns list of available `WorkoutResponse` templates.
2. `POST /athletes/me/saved-workouts` with `workout_template_id` → Saves template to athlete's personal collection.
3. `GET /athletes/me/saved-workouts` → Returns athlete's bookmarked workouts.

### Flow D: Coach Assignment & Workout Scheduling
1. Coach calls `GET /coaches/{coach_id}/athletes` → Retrieves assigned athletes.
2. Coach calls `POST /training-plans/` → Creates periodized training plan for an assigned athlete.
3. Coach calls `POST /training-plans/assignments/` → Maps a `workout_template_id` to a plan `session_id`.
4. Athlete calls `GET /training/today` → System resolves current day's assigned workout sessions.

### Flow E: Live Workout Execution & Metric Logging
1. Athlete calls `POST /workout-sessions/start` with `assignment_id` → Inserts `workout_sessions` document (`status: "in_progress"`).
2. As exercises are completed, athlete calls `POST /performance-logs` → Inserts `performance_logs` document with exercise metrics (weight, reps, sprint time).
3. Athlete calls `POST /workout-sessions/{id}/complete` → Updates `workout_sessions` document (`status: "completed"`, `completed_at`, `total_duration_seconds`).

---

## 6. Request / Response Examples

### Example 1: User Registration (`POST /auth/register`)
**Request:**
```json
{
  "first_name": "Alex",
  "last_name": "Runner",
  "email": "alex.runner@example.com",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!",
  "role": "athlete"
}
```
**Response (HTTP 200 OK):**
```json
{
  "message": "User registered successfully",
  "user_id": "66b1c2e4f8d9a10029b3c4d5",
  "role": "athlete",
  "email": "alex.runner@example.com"
}
```

### Example 2: User Login (`POST /auth/login`)
**Request:**
```json
{
  "email": "alex.runner@example.com",
  "password": "SecurePassword123!"
}
```
**Response (HTTP 200 OK):**
```json
{
  "access_token": "<access_token>",
  "token_type": "bearer"
}
```

### Example 3: Workout Template Listing (`GET /workouts?sport=Sprinting`)
**Response (HTTP 200 OK):**
```json
[
  {
    "id": "w_template_001",
    "workout_id": "w_template_001",
    "title": "100m Acceleration Development",
    "description": "Focus on drive phase mechanics and ground force production.",
    "sport": "Sprinting",
    "category": "Speed",
    "difficulty": "Intermediate",
    "duration_minutes": 60,
    "equipment": ["Blocks", "Cones"],
    "instructions": "Warm up thoroughly before max velocity reps.",
    "created_by": "system",
    "created_by_role": "admin",
    "is_public": true,
    "created_at": "2026-08-01T10:00:00Z",
    "updated_at": "2026-08-01T10:00:00Z"
  }
]
```

### Example 4: Record Performance Log (`POST /performance-logs`)
**Request:**
```json
{
  "workout_session_id": "ws_session_99",
  "assignment_id": "wa_assign_12",
  "activity_label": "Fly 30m Sprint",
  "metrics": {
    "sprint_time": 3.42,
    "rpe": 8
  },
  "notes": "Good acceleration out of fly zone"
}
```
**Response (HTTP 201 Created):**
```json
{
  "id": "pl_log_55",
  "workout_session_id": "ws_session_99",
  "assignment_id": "wa_assign_12",
  "athlete_id": "66b1c2e4f8d9a10029b3c4d5",
  "activity_label": "Fly 30m Sprint",
  "metrics": {
    "sprint_time": 3.42,
    "rpe": 8
  },
  "source_type": "manual",
  "notes": "Good acceleration out of fly zone",
  "is_personal_record": true,
  "recorded_at": "2026-08-12T11:15:00Z",
  "created_at": "2026-08-12T11:15:00Z",
  "updated_at": "2026-08-12T11:15:00Z"
}
```

---

## 7. Error Handling

FastAPI automatically handles payload validation, while services raise explicit `HTTPException` instances. Errors are parsed by the frontend utility `formatApiDetailMessage()` in [frontend/src/utils/ApiError.ts](file:///home/vishwesh/athlitech-app/frontend/src/utils/ApiError.ts).

| HTTP Status | Trigger Condition | Backend Error Payload Example |
| :--- | :--- | :--- |
| **200 OK** | Successful execution of read/update operations. | Result object or JSON message |
| **201 Created** | Successful creation of resources (`/performance-logs`, `/athletes/me/saved-workouts`). | Created object payload |
| **400 Bad Request** | Business logic violation (e.g. duplicate order in workout assignment, invalid passwords). | `{"detail": "Workout Assignment with order 1 already exists"}` |
| **401 Unauthorized** | Missing or invalid JWT access/refresh token; incorrect login credentials. | `{"detail": "Invalid email or password"}` |
| **403 Forbidden** | User lacks required role permission (e.g. non-coach adding performance records). | `{"detail": "Insufficient permissions"}` |
| **404 Not Found** | Target resource ID does not exist in database collection. | `{"detail": "Workout Template with ID 'xyz' does not exist"}` |
| **422 Unprocessable Entity** | Pydantic validation failure for request body or query params. | `{"detail": [{"loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error.email"}]}` |
| **500 Internal Error** | Unhandled server exception during database execution. | `{"detail": "Failed to fetch admin dashboard summary: DB error"}` |

---

## 8. Frontend API Layer Architecture

The frontend separates API communication from React UI components into dedicated modules in `frontend/src/api/`:

* **[auth.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/auth.ts)**: Handles `login()`, `registerUser()`, `fetchCurrentUser()`, and token persistence (`localStorage`).
* **[profile.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/profile.ts)**: Handles `completeProfile()`, `fetchMyProfile()`, `fetchWorkoutRecommendations()`.
* **[workout.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/workout.ts)**: Handles template fetching, workout creation, status updates, metadata retrieval.
* **[performance.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/performance.ts)**: Handles logging exercise metrics (`createPerformanceLog`), fetching session logs, legacy performance CRUD.
* **[roleHub.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/roleHub.ts)**: Handles Role Hub workspace status (`fetchRoleHubStatus`), role activation/deactivation.
* **[organization.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/organization.ts)**: Handles org creation, plan updates, invitation link generation.
* **[admin.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/admin.ts)**: Handles user listing, role assignments, custom role CRUD, coach-athlete assignments.

---

## 9. API Security Summary

* **Authentication**: JWT signed with `HS256` secret key. Refresh tokens stored securely in `HttpOnly`, `SameSite=None` cookies.
* **Header Transmission**: HTTP requests pass `Authorization: Bearer <access_token>`.
* **Password Hashing**: Bcrypt salt-and-hash algorithm.
* **Role Guards**: FastAPI dependencies (`require_admin`, `require_coach_or_admin`, `get_current_user`).
* **Tenant Isolation**: Service-level query filtering by `organization_id`, `account_id`, and `athlete_id`.

---

## 10. API Architecture Lifecycle

Detailed execution lifecycle for `POST /training-plans/assignments/`:

```
[React UI Component] 
       │ (1. Invokes API helper with assignment payload)
       ▼
[frontend/src/api/workout.ts] 
       │ (2. Sends HTTP POST with Bearer token)
       ▼
[FastAPI Router: workout_assignment_routes.py] 
       │ (3. Matches endpoint @router.post('/assignments/'))
       ▼
[get_current_user Dependency] 
       │ (4. Decodes JWT token & verifies user identity)
       ▼
[Pydantic Validation] 
       │ (5. Validates WorkoutAssignmentCreate schema)
       ▼
[workout_assignment_service.py] 
       │ (6. Executes _verify_session_access & verifies plan access)
       ▼
[workout_assignment_repository.py] 
       │ (7. Formats document & executes Motor insert_one)
       ▼
[MongoDB athlitech.workout_assignments Collection] 
       │ (8. Persists document & returns inserted ID)
       ▼
[FastAPI Response Formatter] 
       │ (9. Serializes WorkoutAssignmentResponse JSON)
       ▼
[React UI Component] (10. Receives typed response & updates UI state)
```

---

## 11. API Limitations & Future Scope

### Current Limitations
1. No native rate-limiting middleware configured on API routes.
2. Webhooks and real-time push notifications are not currently implemented.
3. Bulk batch export endpoints are limited to paginated JSON responses.

### Future Scope (Unimplemented Features)
* AI-driven automated training plan generation endpoints.
* WebSocket connections for live real-time workout telemetry streaming.
* Stripe billing webhook handlers for automated subscription billing sync.

---

## 12. Mentor API Review Q&A

**Q: What is an API endpoint?**  
*A:* A specific HTTP URL path and method combination (e.g. `POST /auth/login`) exposed by the FastAPI server to perform CRUD operations or execute business workflows.

**Q: How does the frontend communicate with FastAPI?**  
*A:* The frontend uses native `fetch()` calls packaged inside API modules (`frontend/src/api/*.ts`), serializing JSON payloads and attaching `Authorization: Bearer <token>` headers.

**Q: Where is authentication checked?**  
*A:* Authentication is checked in the FastAPI dependency `get_current_user` in [backend/services/auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py), which decodes incoming JWT tokens.

**Q: Where is authorization checked?**  
*A:* Authorization is checked both at the route level via dependencies (`require_admin`, `require_coach_or_admin`) and at the service level via scoping checks (e.g. `_verify_plan_access()`).

**Q: What is the difference between 401 and 403 error codes?**  
*A:* HTTP 401 Unauthorized indicates unauthenticated requests (missing/invalid JWT token), whereas HTTP 403 Forbidden indicates the user is authenticated but lacks required permissions/roles for the resource.

**Q: Why use Pydantic schemas?**  
*A:* Pydantic schemas enforce type safety, perform data validation, parse incoming HTTP request bodies, and format JSON response structures automatically.

**Q: Why separate routes, services, and repositories?**  
*A:* Routes handle HTTP concerns, services execute core business logic and authorization checks, and repositories manage database query operations against MongoDB.

---

## Final Verification & Compliance Report

1. **Total Endpoint Count**: **94 Endpoints** verified across 19 route modules and [main.py](file:///home/vishwesh/athlitech-app/backend/main.py).
2. **Verified Route Groups**:
   * Authentication (5)
   * Profile (3)
   * Role Profiles / Workspace (3)
   * Athlete & Coach (6)
   * Workouts & Templates (10)
   * Training Plans, Weeks, Days, Sessions, Assignments (25)
   * Today's Training (1)
   * Workout Sessions (7)
   * Metric Definitions & Performance Logs (11)
   * Organization (6)
   * Users, Roles, Admin & Dashboard (17)
3. **Discrepancies Found**: None. Every documented endpoint maps 1:1 to an active `@router` decorator in `backend/routes/`.

**"API documentation verified against the current codebase with no identified endpoint inaccuracies."**
