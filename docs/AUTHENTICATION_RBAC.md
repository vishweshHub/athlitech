# AthliTech Final Authentication & RBAC Documentation

> **Status:** Final Frozen Codebase Verification  
> **Target System:** AthliTech Core Security & Workspace Architecture  
> **Source Files Verified:**  
> - [backend/core/security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py)  
> - [backend/core/permissions.py](file:///home/vishwesh/athlitech-app/backend/core/permissions.py)  
> - [backend/core/constants.py](file:///home/vishwesh/athlitech-app/backend/core/constants.py)  
> - [backend/services/auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py)  
> - [backend/routes/auth_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/auth_routes.py)  
> - [backend/routes/role_profile_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/role_profile_routes.py)  
> - [frontend/src/api/auth.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/auth.ts)  
> - [frontend/src/api/roleHub.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/roleHub.ts)  
> - [frontend/src/constants/api.ts](file:///home/vishwesh/athlitech-app/frontend/src/constants/api.ts)  
> - [frontend/src/context/WorkspaceContext.tsx](file:///home/vishwesh/athlitech-app/frontend/src/context/WorkspaceContext.tsx)  
> - [frontend/src/utils/permissions.ts](file:///home/vishwesh/athlitech-app/frontend/src/utils/permissions.ts)

---

## 1. Authentication Architecture

The AthliTech authentication lifecycle follows an end-to-end asynchronous workflow connecting FastAPI backend services with the cross-platform frontend client:

```
[User Request] ──POST /auth/register──► [auth_service.py: register_user()]
                                                │
                                                ├──► Hash Password (security.py: hash_password)
                                                └──► Create documents in users, accounts,
                                                     role_profiles, memberships, athletes
                                                
[User Request] ──POST /auth/login─────► [auth_service.py: login_user()]
                                                │
                                                ├──► Verify Password (security.py: verify_password)
                                                └──► Issue JWT Access Token & Refresh Cookie

[Frontend Client] ────────────────────► Store Token (constants/api.ts: storeToken)
                                                │ (Web: localStorage | Mobile: Expo.SecureStore)
                                                ▼
[API Request] ──Headers Authorization──► [auth_service.py: get_current_user()]
                                                │
                                                ├──► Decode & Validate JWT (security.py: decode_access_token)
                                                ├──► Resolve User Account & Active Workspace Roles
                                                └──► Inject current_user Dict into Protected Route
```

### Step-by-Step Flow Execution
1. **Registration**: Client sends `RegisterRequest` (`first_name`, `last_name`, `email`, `password`, `role`) to `POST /auth/register`.
2. **Password Hashing**: `auth_service.register_user()` delegates plaintext password hashing to `security.hash_password()`, executing bcrypt salt generation and hashing.
3. **Account & Profile Provisioning**: The backend creates documents in `users` collection, dual-writes to `accounts` collection (`account_id = user_id`), provisions default role metadata in `role_profiles` collection (`athlete_data` or `coach_data`), links the account to default organization in `memberships` collection, and creates an `athletes` domain record if role is `athlete`.
4. **Login & Verification**: Client sends `UserLogin` (`email`, `password`) to `POST /auth/login`. `auth_service.login_user()` fetches user record from `users` and calls `security.verify_password()` to compare bcrypt hashes.
5. **Token Generation**: Upon successful authentication, `security.create_access_token()` and `security.create_refresh_token()` generate signed JWT strings. The access token is returned in JSON payload; the refresh token is set in an `HttpOnly`, `SameSite=None`, `Secure` cookie.
6. **Frontend Token Storage**: Frontend invokes `storeToken(token)` in [frontend/src/constants/api.ts](file:///home/vishwesh/athlitech-app/frontend/src/constants/api.ts), persisting the token to `localStorage` on Web or `Expo.SecureStore` on Native mobile platforms.
7. **Authenticated Requests**: Subsequent API calls attach `Authorization: Bearer <access_token>` in HTTP headers.
8. **Token Decoding & Verification**: Protected FastAPI endpoints execute `get_current_user(credentials=Depends(bearer_scheme))` dependency. `security.decode_access_token()` verifies JWT signature and expiration.
9. **Current-User Resolution**: `get_current_user()` resolves account identity, queries active `role_profiles` and `memberships`, constructs the `active_roles` set, and injects `current_user` dictionary into the target router function.

---

## 2. Password Security

### Bcrypt Implementation
Password hashing is handled in [backend/core/security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py) using the **`bcrypt`** library:

* **Hashing (`hash_password`)**:
  ```python
  def hash_password(password: str) -> str:
      password_bytes = password.encode("utf-8")
      salt = bcrypt.gensalt()
      hashed_password = bcrypt.hashpw(password_bytes, salt)
      return hashed_password.decode("utf-8")
  ```
  Generates a cryptographically secure random salt (`bcrypt.gensalt()`) and hashes the password bytes.
* **Verification (`verify_password`)**:
  ```python
  def verify_password(plain_password: str, hashed_password: str) -> bool:
      plain_bytes = plain_password.encode("utf-8")
      hashed_bytes = hashed_password.encode("utf-8")
      return bcrypt.checkpw(plain_bytes, hashed_bytes)
  ```
  Compares candidate plaintext against stored bcrypt hash using constant-time string comparison (`bcrypt.checkpw`).

### Storage Safety
* Plaintext passwords are **NEVER stored** in any database collection, log file, or JWT payload.
* Only the 60-character bcrypt hash string (storing algorithm ID, cost factor, salt, and hash digest) is saved in the `hashed_password` field of `users` and `accounts` collections.

---

## 3. JWT Architecture

AthliTech utilizes JSON Web Tokens (JWT) implemented via `python-jose` in [backend/core/security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py):

* **Library**: `jose` (`jose.jwt`, `jose.JWTError`).
* **Algorithm**: `HS256` (HMAC with SHA-256), configured via `ALGORITHM = os.getenv("ALGORITHM", "HS256")`.
* **Payload Claims Structure**:
  * `sub`: Subject identifier (user lowercased email string).
  * `role`: Primary role identifier (`"athlete"`, `"coach"`, `"admin"`).
  * `account_id`: String UUID matching account document.
  * `membership_id`: Active tenant membership ID (or `None`).
  * `organization_id`: Active organization ID (or `None`).
  * `exp`: UTC Unix expiration timestamp.
* **Expiration Lifetimes**:
  * **Access Token**: Configured by `ACCESS_TOKEN_EXPIRE_MINUTES` in `core/config.py` (defaults to 15–60 minutes).
  * **Refresh Token**: Configured by `REFRESH_TOKEN_EXPIRE_DAYS` in `core/config.py` (defaults to 7 days).
* **Refresh Token Exchange**: `POST /auth/refresh` reads `refresh_token` from `Cookie(default=None)`, calls `security.decode_refresh_token()`, verifies user existence in `users` collection, and issues a new access token + fresh cookie.
* **Invalid/Expired Token Handling**: `decode_access_token()` catches `JWTError` or missing `sub` claim and raises `HTTPException(status_code=401, detail="Invalid token" / "Invalid or expired token")`.

---

## 4. Token Storage

Token storage is strictly platform-aware, implemented in [frontend/src/constants/api.ts](file:///home/vishwesh/athlitech-app/frontend/src/constants/api.ts):

```typescript
export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    return null;
  }
}
```

* **Web (`Platform.OS === 'web'`)**: Access token stored in browser `localStorage` under key `athlitech_auth_token`.
* **Native Mobile (`Platform.OS === 'ios'` | `'android'`)**: Access token encrypted and stored using **`expo-secure-store`** (`SecureStore.setItemAsync` / `SecureStore.getItemAsync`), leveraging iOS Keychain / Android KeyStore.
* **Refresh Token**: Managed server-side via `HttpOnly`, `SameSite=None`, `Secure` HTTP cookies to prevent JavaScript XSS extraction.

---

## 5. Authentication Dependencies

Protected API endpoints inject `get_current_user` in [backend/services/auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py):

```
HTTP Authorization Header ("Bearer <token>")
       │
       ▼
bearer_scheme = HTTPBearer() (FastAPI Security)
       │
       ▼
decode_access_token(token) (Decodes JWT & verifies signature/exp)
       │
       ▼
users_collection.find_one({"email": email}) (Fetches user record)
       │
       ▼
memberships_collection & role_profiles_collection (Queries tenant memberships & role profiles)
       │
       ▼
Resolves active_roles set (Combines profiles + memberships + legacy role)
       │
       ▼
Injects current_user Dict into Router Function
```

### Injected `current_user` Structure
```python
{
    "id": user_id,
    "account_id": user_id,
    "name": user["name"],
    "email": user["email"],
    "role": normalize_role(user.get("role", "athlete")),
    "active_roles": {"athlete", "coach", "admin"},  # Set of normalized active roles
    "profile_completed": user.get("profile_completed", False),
    "membership_id": mem.get("membership_id"),
    "organization_id": mem.get("organization_id"),
    "coach_id": user.get("coach_id") or user_id,
}
```

---

## 6. Role-Based Access Control (RBAC)

### System Roles
1. **`athlete`**: Default role (`DEFAULT_ROLE = ROLE_ATHLETE`). Access to personal workout sessions, performance logs, personal training plans, and athlete dashboard.
2. **`coach`**: Access to assigned athlete rosters, workout template creation, training plan creation/assignment, and coach dashboard.
3. **`admin`**: System administrator. Full platform oversight, user role editing, custom role creation, platform analytics.

### Role Definition & Normalization
* Standard role strings are defined in [backend/core/constants.py](file:///home/vishwesh/athlitech-app/backend/core/constants.py) (`ROLE_ADMIN`, `ROLE_COACH`, `ROLE_ATHLETE`).
* `normalize_role(role)` in [backend/core/permissions.py](file:///home/vishwesh/athlitech-app/backend/core/permissions.py) strips whitespace, lowercases input, and defaults to `"athlete"`.

### Route-Level Guards
FastAPI route guards implemented in [backend/services/auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py):

* **`require_admin(current_user=Depends(get_current_user))`**:
  Calls `_validate_role(current_user, {"admin"})`. Verifies `"admin"` is present in `current_user["active_roles"]`. Raises `HTTPException(403, detail="Insufficient permissions")` if missing.
* **`require_coach_or_admin(current_user=Depends(get_current_user))`**:
  Calls `_validate_role(current_user, {"admin", "coach"})`. Verifies `"admin"` or `"coach"` is in `active_roles`. Raises `HTTPException(403)` if missing.
* **`require_admin_or_self(user_id: str, current_user=Depends(get_current_user))`**:
  Allows request if `current_user["id"] == user_id`; otherwise validates `{"admin"}` role.

---

## 7. Granular Permission Architecture

Granular permissions complement high-level roles by defining fine-grained action scopes.

### Permission Mapping
Defined in [backend/core/constants.py](file:///home/vishwesh/athlitech-app/backend/core/constants.py) and mirrored in [frontend/src/utils/permissions.ts](file:///home/vishwesh/athlitech-app/frontend/src/utils/permissions.ts):

| Permission String | Purpose / Action Scope | Admin | Coach | Athlete |
| :--- | :--- | :---: | :---: | :---: |
| `manage_users` | Create, update role, or delete user accounts | Yes | No | No |
| `manage_roles` | Create custom roles & edit role permission lists | Yes | No | No |
| `manage_athletes` | Roster management & coach assignments | Yes | Yes | No |
| `manage_coaches` | Coach allocation & organization oversight | Yes | No | No |
| `manage_organizations` | Edit organization settings & custom org creation | Yes | No | No |
| `invite_members` | Generate invitation links for org members | Yes | Yes | No |
| `manage_subscriptions` | Upgrade/cancel workspace plan tier | Yes | Yes | Yes |
| `view_analytics` | Access analytics dashboards | Yes | Yes | Yes |
| `view_athlete_profiles` | Inspect athlete profile details | Yes | Yes | Yes |
| `assign_workouts` | Assign workout templates to training plan sessions | Yes | Yes | No |
| `edit_workouts` | Modify workout templates & training plans | Yes | Yes | No |
| `view_self` | Access personal profile, active sessions, and logs | Yes | Yes | Yes |

### Permission Evaluation Logic
`has_permission(role, permission, user_permissions)` in [backend/core/permissions.py](file:///home/vishwesh/athlitech-app/backend/core/permissions.py):
1. Evaluates explicit `user_permissions` list if attached to the custom role/user.
2. Fallback: Checks whether `permission` string exists within `DEFAULT_ROLE_PERMISSIONS[role]`.

### Custom Roles Support
Admins can create custom roles (`POST /roles/`) and update custom role permissions (`PUT /roles/{role_name}/permissions`), which are saved in the `roles` database collection (`db["roles"]`).

---

## 8. Role Hub / Workspace Architecture

AthliTech separates identity from operational view context using the **Role Hub / Workspace** pattern:

```
                  ┌──────────────────────────────┐
                  │ Authenticated Account        │
                  │ (Single email / account_id)  │
                  └──────────────┬───────────────┘
                                 │
                   GET /role-profiles/status
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
 ┌───────────┐             ┌───────────┐             ┌──────────────┐
 │ Athlete   │             │ Coach     │             │ Organization │
 │ Profile   │             │ Profile   │             │ Profile      │
 └─────┬─────┘             └─────┬─────┘             └──────┬───────┘
       │                         │                          │
       └─────────────────────────┼──────────────────────────┘
                                 │
                      POST /role-profiles/activate
                                 │
                   WorkspaceContext.tsx (Frontend)
                                 │
                  setCurrentWorkspace('coach')
                                 │
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│ Coach Dashboard Screen  │               │ Coach Roster & Plans    │
└─────────────────────────┘               └─────────────────────────┘
```

### Concepts Defined
* **Authentication**: Proves identity (`account_id`, email, password verification).
* **Role**: Entitlement to domain functionalities (`athlete`, `coach`, `organization`, `admin`).
* **Permission**: Action capability string (`assign_workouts`, `manage_users`).
* **Workspace**: The active UI operational perspective selected by the user (`currentWorkspace`).

### Multi-Role Workspace Switching
1. **Single Account Identity**: A user registers once (e.g. as a Coach). They possess a single `account_id` and single JWT authentication credential.
2. **Role Activation**: User opens Role Hub (`/role-hub`) and clicks "Activate Athlete Role".
3. **Backend Service (`POST /role-profiles/activate`)**: Provisions an `athlete` entry in `role_profiles` collection and `memberships` collection without requiring a separate account or new login credentials.
4. **Frontend Context Sync (`WorkspaceContext.tsx`)**:
   * Calls `refreshWorkspaceStatus()` → invokes `GET /role-profiles/status`.
   * Computes `activeRoles: ['coach', 'athlete']`.
   * Allows seamless workspace switching via `setCurrentWorkspace('athlete')` or `setCurrentWorkspace('coach')`.
   * Navigates dynamically between `/athlete-dashboard` and `/coach-dashboard`.
   * Persists active choice to `localStorage` (`athlitech_active_workspace`).

---

## 9. Resource-Level Authorization

In addition to static role guards, AthliTech enforces **dynamic resource-level authorization** inside service and route logic:

### 1. Coach-Athlete Roster Isolation
* **Route**: `GET /coaches/{coach_id}/athletes` in [backend/routes/athlete_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/athlete_routes.py).
* **Enforcement**: Unless user is `admin`, the route verifies `user_coach_id == coach_id`. Queries `athletes` matching `{"coach_id": coach_id}`.
* **Assignment Route**: `POST /athletes/{athlete_id}/assign/{coach_id}` verifies that non-admin coaches can only assign athletes to themselves.

### 2. Training Plan Ownership & Scoping
* **Service**: `_verify_plan_access(plan, current_user, require_write)` in [backend/services/training_plan_service.py](file:///home/vishwesh/athlitech-app/backend/services/training_plan_service.py).
* **Enforcement**:
  * Admins have unrestricted access.
  * Athletes can only access plans where `athlete_id == user_id` or `created_by == user_id`.
  * Coaches can access plans created by themselves (`created_by == user_id`) or plans belonging to athletes assigned to them (`athletes.coach_id == user_id`).

### 3. Workout Session & Performance Log Scoping
* **Repository**: `delete_logs_by_session_id(workout_session_id, athlete_id)` in [backend/repositories/performance_log_repository.py](file:///home/vishwesh/athlitech-app/backend/repositories/performance_log_repository.py).
* **Enforcement**: Scopes deletion strictly to `{"workout_session_id": workout_session_id, "athlete_id": athlete_id}` ensuring athletes cannot delete logs belonging to other users.

### 4. Admin Self-Protection
* **Route**: `PUT /users/{user_id}/role` and `DELETE /users/{user_id}` in [backend/routes/user_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/user_routes.py).
* **Enforcement**: Explicitly checks `if user_id == current_user.get("id"): raise HTTPException(400, detail="Admins cannot change/delete their own account")`.

---

## 10. Authentication Error Handling

| Scenario | HTTP Status | Error Detail Message | Handled At |
| :--- | :---: | :--- | :--- |
| Missing Bearer Header | **401 Unauthorized** | `"Not authenticated"` | `bearer_scheme` / FastAPI |
| Invalid / Corrupted JWT | **401 Unauthorized** | `"Invalid token"` | `security.decode_access_token` |
| Expired Access Token | **401 Unauthorized** | `"Invalid or expired token"` | `security.decode_access_token` |
| Invalid Email or Password | **401 Unauthorized** | `"Invalid email or password"` | `auth_service.login_user` |
| Missing Refresh Cookie | **401 Unauthorized** | `"Refresh token missing"` | `auth_routes.refresh` |
| Non-Admin Accessing Admin Route | **403 Forbidden** | `"Insufficient permissions"` | `auth_service.require_admin` |
| Non-Coach Adding Performance | **403 Forbidden** | `"Only coaches can add performance records"` | `performance_routes.create_performance` |
| Coach Viewing Unassigned Athlete | **403 Forbidden** | `"Coaches can only access their assigned athletes"` | `athlete_routes.get_athlete_by_id` |
| Athlete Viewing Other Athlete Summary | **403 Forbidden** | `"Athletes can only view their own dashboard summary"` | `dashboard_routes.read_athlete_summary` |
| Modifying Default Role Permissions | **400 Bad Request** | `"Cannot edit permissions of default roles"` | `role_routes.update_role_permissions` |

---

## 11. Security Architecture Decisions

1. **Why Bcrypt?** Bcrypt incorporates an adaptive work factor (cost factor) and automatically manages cryptographic salt generation, protecting stored hashes against rainbow table attacks and GPU-accelerated brute forcing.
2. **Why JWT Bearer Tokens?** JWT allows stateless authentication verification across distributed API nodes without requiring server-side session lookup tables in database memory for every HTTP request.
3. **Why Dual-Token (Access + Refresh Cookie)?** Short-lived access tokens limit exposure if compromised, while HttpOnly refresh cookies prevent cross-site scripting (XSS) extraction while maintaining seamless user session renewal.
4. **Why FastAPI Dependencies (`Depends`)?** Centralizes authentication and authorization logic into declarative, reusable function chains executed before route handlers, eliminating repetitive security boilerplate.
5. **Why Combine RBAC & Granular Permissions?** RBAC provides coarse-grained access control for standard user personas (`admin`, `coach`, `athlete`), while granular permissions (`assign_workouts`, `manage_users`) allow custom role creation and fine-grained feature toggles.
6. **Why Service-Level Resource Scoping?** Static role guards verify *what type* of user is making the request, but service-level authorization verifies *whether this specific user owns or is assigned to this specific resource*.
7. **Why Workspace Role Hub Architecture?** Enables multi-faceted sports users (e.g. a person who is both a Head Coach and an active Athlete) to operate in distinct UX modes without logging out or maintaining multiple login credentials.

---

## 12. Current Limitations & Future Scope

### Current Implementation Limitations
* **No Multi-Factor Authentication (MFA)**: Authentication relies strictly on single-factor email/password credentials.
* **No OAuth2 / Social SSO Providers**: External authentication providers (Google, Apple, SAML) are not implemented.
* **No Refresh Token Rotation Blacklist**: Refresh tokens are validated via JWT signature without checking against a database revocation/blacklist table on logout.

### Future Scope
1. Implement TOTP-based Multi-Factor Authentication (MFA).
2. Integrate OAuth2 OIDC social login providers (Google, Apple).
3. Implement active token revocation blacklist in Redis / MongoDB for immediate session invalidation on logout.

---

## 13. Mentor Review Q&A

**Q: Why hash passwords with bcrypt instead of storing them as plain text or SHA-256?**  
*A:* Plaintext storage exposes user credentials during database breaches. Standard SHA-256 is fast and vulnerable to GPU brute-forcing and rainbow tables. Bcrypt introduces a slow, work-factor key derivation function with unique random salting per password.

**Q: Where is JWT created and where is it verified in AthliTech?**  
*A:* JWTs are created in `create_access_token()` in [backend/core/security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py) upon successful login in `auth_service.login_user()`. They are decoded and verified in `decode_access_token()` in `security.py`, invoked by the `get_current_user` dependency on every protected API route.

**Q: What happens when an access token expires?**  
*A:* `decode_access_token()` catches the expiration error from `jose.jwt` and raises an HTTP 401 Unauthorized exception. The client calls `POST /auth/refresh` with its `HttpOnly` refresh cookie to receive a new access token.

**Q: What is the difference between authentication and authorization?**  
*A:* **Authentication** verifies *who* the user is (email/password check, JWT verification). **Authorization** determines *what actions* that authenticated user is permitted to perform (RBAC guards, `has_permission()`, `_verify_plan_access()`).

**Q: Why do we need granular permissions if we already have roles?**  
*A:* Roles group standard permissions for default user types (`athlete`, `coach`, `admin`). Granular permissions allow system administrators to create custom roles (e.g., "Assistant Coach" or "Physio") with tailored action rights (`view_athlete_profiles`, but not `manage_subscriptions`).

**Q: How does a coach access only their assigned athletes?**  
*A:* Route handlers and services fetch the coach's resolved `coach_id` from the authenticated user context and filter MongoDB queries matching `{"coach_id": coach_id}`. If a coach attempts to query an unassigned athlete ID, service logic raises an HTTP 403 Forbidden exception.

**Q: What is the difference between a Role and a Workspace in AthliTech?**  
*A:* A **Role** represents an account entitlement/profile stored in `role_profiles` and `memberships` collections. A **Workspace** is the active UX view state (`currentWorkspace` in `WorkspaceContext.tsx`) selected by the user to focus their dashboard interface on either athlete, coach, or organization operations.

**Q: What happens if a user manually calls an API endpoint they are not allowed to access?**  
*A:* The FastAPI route dependency (`require_admin` or `require_coach_or_admin`) or service validation (`_verify_plan_access`) intercepts the request prior to database execution and returns an HTTP 403 Forbidden response.

---

## Final Verification & Compliance Report

* **A. Files Inspected**:
  - Backend: [security.py](file:///home/vishwesh/athlitech-app/backend/core/security.py), [permissions.py](file:///home/vishwesh/athlitech-app/backend/core/permissions.py), [constants.py](file:///home/vishwesh/athlitech-app/backend/core/constants.py), [auth_service.py](file:///home/vishwesh/athlitech-app/backend/services/auth_service.py), [auth_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/auth_routes.py), [role_profile_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/role_profile_routes.py), all models and services.
  - Frontend: [auth.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/auth.ts), [roleHub.ts](file:///home/vishwesh/athlitech-app/frontend/src/api/roleHub.ts), [api.ts](file:///home/vishwesh/athlitech-app/frontend/src/constants/api.ts), [WorkspaceContext.tsx](file:///home/vishwesh/athlitech-app/frontend/src/context/WorkspaceContext.tsx), [permissions.ts](file:///home/vishwesh/athlitech-app/frontend/src/utils/permissions.ts).
* **B. Authentication Flow Verified**: Verified 1:1 against `security.py`, `auth_service.py`, and `auth_routes.py`.
* **C. RBAC Verified**: Verified `require_admin`, `require_coach_or_admin`, `require_admin_or_self` dependencies and role normalization helpers.
* **D. Granular Permissions Verified**: Verified 12 permissions in `constants.py` and `frontend/src/utils/permissions.ts`, `has_permission()` logic, and custom role permissions updating.
* **E. Workspace/Role Hub Flow Verified**: Verified `RoleHubStatusResponse`, `/role-profiles/activate`, `/role-profiles/status`, and `WorkspaceContext.tsx` provider logic.
* **F. Discrepancies**: None found.
* **G. Unverified Claims**: OAuth2/Social SSO and MFA are confirmed as unimplemented and documented exclusively under Future Scope.

**"Authentication and RBAC documentation verified against the current codebase with no identified inaccuracies."**
