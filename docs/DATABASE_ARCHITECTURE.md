# AthliTech Database Architecture Documentation

> **Status:** Final Frozen Codebase Documentation  
> **Target System:** AthliTech Backend API (FastAPI + MongoDB / Motor)  
> **Rule Compliance:** Strictly based on implemented repository code. No fictional tables, foreign keys, or unverified indexes.

---

## 1. Database Technology

### Engine & Choice Rationale
AthliTech utilizes **MongoDB** (a NoSQL document-oriented database) as its primary data store. The selection of MongoDB for AthliTech is driven by specific technical requirements of the sports performance domain:

1. **Schema Flexibility for Dynamic Metrics**: Athletic performance logging requires capturing diverse, sport-specific metrics (e.g., sprint split times, 1RM weight, heart rate zones, jump height, throwing distance). Storing metrics as a dynamic key-value dictionary (`metrics: Dict[str, Any]` in `performance_logs`) allows adding or modifying exercise metrics without altering database schemas or executing DDL migrations.
2. **Hierarchical Document Modeling**: Core domain structures—such as periodized training plans (`TrainingPlan` → `TrainingWeek` → `TrainingDay` → `Session` → `WorkoutAssignment`) and multi-role profiles (`RoleProfile` embedding `AthleteRoleData`, `CoachRoleData`, `AdminRoleData`)—map naturally to JSON/BSON document trees.
3. **Asynchronous Python Ecosystem**: Seamless mapping between MongoDB BSON documents, Python dictionaries, and FastAPI/Pydantic validation models via asynchronous I/O.

### Connection Driver
The application connects to MongoDB using **Motor** (`motor.motor_asyncio.AsyncIOMotorClient`), the official asynchronous Python driver built on PyMongo. Motor allows database operations to be non-blocking, operating within FastAPI's `asyncio` event loop.

---

## 2. Database Connection Architecture

### Components & File Map
The connection lifecycle, database configuration, and driver initialization are implemented across four primary backend files:

```
[backend/core/config.py]
       │ (Loads MONGODB_URI / Credentials from .env)
       ▼
[backend/database/mongodb.py]
       │ (Instantiates AsyncIOMotorClient & binds event loop)
       ▼
[backend/database/utils.py]
       │ (Provides to_object_id, serialize_doc, fetch_cursor_list)
       ▼
[backend/main.py]
         (Invokes startup seeding via FastAPI @app.on_event("startup"))
```

* **[backend/core/config.py](file:///home/vishwesh/athlitech-app/backend/core/config.py)**: Loads environment variables using `python-dotenv`. Reads `MONGODB_URI` directly, or dynamically constructs a connection URI (`mongodb+srv://...`) using `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `MONGODB_CLUSTER`. Defines default database name `MONGODB_DATABASE` (default: `"athlitech"`).
* **[backend/database/mongodb.py](file:///home/vishwesh/athlitech-app/backend/database/mongodb.py)**: Creates the singleton `AsyncIOMotorClient(MONGODB_URI)` instance, binds it to the running asyncio loop (`client.get_io_loop = asyncio.get_running_loop`), initializes `db = client[MONGODB_DATABASE]`, and exports PyMongo collection references.
* **[backend/database/utils.py](file:///home/vishwesh/athlitech-app/backend/database/utils.py)**: Utility functions for database access:
  * `to_object_id(id_val)`: Safely converts string inputs to BSON `ObjectId`.
  * `serialize_doc(doc)`: Converts document `_id` fields to strings for API responses.
  * `fetch_cursor_list(cursor, skip, limit)`: Asynchronously iterates `AsyncIOMotorCursor` with pagination.
* **[backend/main.py](file:///home/vishwesh/athlitech-app/backend/main.py)**: Triggers initialization tasks on FastAPI startup (`@app.on_event("startup")`), executing default role seeding (`seed_default_roles()`), demo user seeding (`seed_demo_users()`), and workout library seeding (`seed_demo_workouts()`).

---

## 3. Collections

The application references **20 MongoDB collections** exported by [backend/database/mongodb.py](file:///home/vishwesh/athlitech-app/backend/database/mongodb.py):

| Collection | Purpose | Important Fields | Main References |
| :--- | :--- | :--- | :--- |
| `accounts` | Unified multi-tenant user identity and credential store. | `account_id`, `email`, `hashed_password`, `first_name`, `last_name`, `account_status`, `verification_status`, `profile_completed` | `account_id` referenced in `memberships`, `role_profiles`, `organizations`, `athletes` |
| `users` | Legacy user collection maintained alongside `accounts` during dual-write phase. | `_id`, `email`, `hashed_password`, `name`, `role`, `coach_id`, `account_status`, `verification_status` | `_id` referenced as `user_id` in `profiles`; `coach_id` referenced in `athletes` |
| `organizations` | Tenant container representing a club, team, or enterprise organization. | `organization_id`, `name`, `slug`, `owner_account_id`, `org_type`, `sport`, `plan_tier`, `status` | `owner_account_id` → `accounts.account_id`; `organization_id` referenced in `memberships`, `subscriptions` |
| `memberships` | Joins user account to an organization with role assignment and coach linkage. | `membership_id`, `account_id`, `organization_id`, `role_profile_id`, `role`, `status`, `assigned_coach_membership_id`, `teams` | `account_id` → `accounts`; `organization_id` → `organizations`; `role_profile_id` → `role_profiles`; `assigned_coach_membership_id` → `memberships` |
| `role_profiles` | Role-specific structured profile metadata (Athlete, Coach, Admin). | `role_profile_id`, `account_id`, `profile_type`, `status`, `athlete_data`, `coach_data`, `admin_data`, `is_complete` | `account_id` → `accounts.account_id`; referenced in `memberships` |
| `subscriptions` | Subscription tier and plan limits per organization. | `subscription_id`, `organization_id`, `plan_tier`, `status`, `max_athletes`, `max_coaches`, `features` | `organization_id` → `organizations.organization_id` |
| `roles` | System permissions lookup table. | `_id`, `name`, `permissions` | `name` matched with role identifiers (`admin`, `coach`, `athlete`) |
| `profiles` | Legacy user profile document for athlete/coach public visibility. | `_id`, `user_id`, `role`, `athlete_data`, `coach_data`, `visibility` | `user_id` → `users._id` |
| `athletes` | Athlete domain record and coach assignment lookup. | `_id`, `athlete_id`, `account_id`, `owner_account_id`, `owner_id`, `name`, `sport`, `weight`, `coach_id` | `athlete_id`/`account_id` → `accounts`; `coach_id` → `users.coach_id`/`accounts.account_id` |
| `workouts` | Master library of workout templates and legacy assigned workouts. | `id`, `workout_id`, `title`, `description`, `sport`, `category`, `difficulty`, `duration_minutes`, `equipment`, `instructions`, `created_by`, `is_public` | `created_by` → `accounts.account_id`; `workout_id` referenced in `workout_assignments`, `workout_sessions`, `athlete_saved_workouts` |
| `training_plans` | High-level periodized training plan container. | `id`, `title`, `description`, `goal`, `athlete_id`, `created_by`, `owner_type`, `start_date`, `end_date`, `status` | `athlete_id` → `athletes.athlete_id`; `created_by` → `users._id`/`accounts.account_id` |
| `training_weeks` | Microcycle weeks contained within a training plan. | `id`, `training_plan_id`, `week_number`, `phase_tag`, `title`, `target_volume`, `target_intensity` | `training_plan_id` → `training_plans.id` |
| `training_days` | Daily training container within a training week. | `id`, `training_week_id`, `date`, `day_name`, `day_type`, `notes` | `training_week_id` → `training_weeks.id` |
| `sessions` | Individual scheduled workout sessions inside a training day. | `id`, `training_day_id`, `session_name`, `order`, `start_time`, `end_time` | `training_day_id` → `training_days.id`; `id` referenced in `workout_assignments`, `workout_sessions` |
| `workout_assignments` | Maps workout template to a training plan session with custom order and overrides. | `id`, `session_id`, `workout_template_id`, `category`, `order`, `assignment_note`, `overrides` | `session_id` → `sessions.id`; `workout_template_id` → `workouts.workout_id` |
| `workout_sessions` | Execution instance of a workout session recorded by an athlete. | `id`, `session_id`, `workout_template_id`, `assignment_id`, `athlete_id`, `source_type`, `status`, `started_at`, `completed_at`, `total_duration_seconds` | `athlete_id` → `athletes.athlete_id`; `session_id` → `sessions.id`; `workout_template_id` → `workouts.id`; `assignment_id` → `workout_assignments.id` |
| `performance_logs` | Metric data points logged during a workout session execution. | `id`, `workout_session_id`, `assignment_id`, `athlete_id`, `activity_label`, `metrics`, `source_type`, `notes`, `is_personal_record`, `recorded_at` | `workout_session_id` → `workout_sessions.id`; `assignment_id` → `workout_assignments.id`; `athlete_id` → `athletes.athlete_id` |
| `metric_definitions` | Global registry defining metric keys, display names, units, and data types. | `id`, `metric_key`, `display_name`, `unit`, `data_type`, `better_direction`, `sport` | `metric_key` matched in `performance_logs.metrics` dictionary |
| `athlete_saved_workouts` | Athlete bookmarks / saved workout templates. | `id`, `athlete_id`, `workout_template_id`, `created_at` | `athlete_id` → `athletes.athlete_id`; `workout_template_id` → `workouts.id` |
| `performances` | Legacy performance log collection. | `performance_id`, `athlete_id`, `coach_id`, `workout_id`, `sport_event`, `value`, `unit`, `feedback`, `recorded_at` | `athlete_id` → `athletes`; `coach_id` → `users`; `workout_id` → `workouts` |

---

## 4. Relationships & Document References

MongoDB relationships in AthliTech are represented as **document references** (string UUIDs or BSON ObjectIds stored in document fields), NOT SQL relational foreign keys.

### Reference Dictionary
* **`account_id`**: String UUID representing primary identity across unified collections (`accounts`, `role_profiles`, `memberships`, `organizations.owner_account_id`, `athletes`).
* **`user_id`**: BSON ObjectId string from `users` collection, used in legacy collections (`profiles`, `users`). In the dual-write setup, `user_id` and `account_id` share identical string values.
* **`athlete_id`**: String UUID identifying an athlete across `athletes`, `training_plans`, `workout_sessions`, `performance_logs`, `athlete_saved_workouts`, and `performances`.
* **`coach_id`**: String UUID identifying a coach across `users`, `athletes`, `performances`, and legacy `workouts`.
* **`organization_id`**: String UUID identifying the tenant container across `organizations`, `memberships`, and `subscriptions`.
* **`created_by`**: String UUID representing the author user ID across `workouts` and `training_plans`.
* **`workout_id` / `workout_template_id`**: String UUID referencing a workout template in `workouts`, `workout_assignments`, `workout_sessions`, `athlete_saved_workouts`, and `performances`.
* **`session_id`**: String UUID connecting a scheduled plan session (`sessions`) to `workout_assignments` and live execution instances (`workout_sessions`).
* **`assignment_id`**: String UUID connecting an assigned workout (`workout_assignments`) to a live execution (`workout_sessions`) and metric logs (`performance_logs`).
* **`workout_session_id`**: String UUID connecting a live workout execution (`workout_sessions`) to metric entries (`performance_logs`).

---

## 5. Core Data Flows

### A. User Registration Flow
1. API receives `RegisterRequest` at `POST /auth/register` handled by `auth_service.py:register_user()`.
2. Checks `users` collection for existing `email`.
3. Inserts document into `users` collection (`name`, `email`, `hashed_password`, `role`).
4. **Dual-Write**: Inserts unified document into `accounts` collection (`account_id = user_id`, `email`, `hashed_password`, `name`, `account_status`).
5. Inserts role-specific document into `role_profiles` collection (`role_profile_id`, `account_id`, `profile_type`, `athlete_data` or `coach_data`).
6. Queries default organization (`slug: "athlitech-primary"`) from `organizations` collection.
7. Inserts membership document into `memberships` collection (`membership_id`, `account_id`, `organization_id`, `role_profile_id`, `role`).
8. If role is `athlete`, inserts default record into `athletes` collection (`athlete_id`, `account_id`, `name`, `sport`, `weight`).

### B. Athlete Profile Flow
1. User authenticates via `POST /auth/login`.
2. Token dependency `get_current_user()` resolves `account_id` from JWT token payload.
3. System fetches `accounts` document using `account_id`.
4. Queries `role_profiles` collection for `{"account_id": account_id, "profile_type": "athlete"}` to retrieve `athlete_data` (sport, event, height, weight, dob, personal_best, primary_goal).
5. Queries `athletes` collection for athlete domain details and coach assignment status.

### C. Coach-Athlete Relationship Flow
1. Legacy Model: `athletes` document contains `coach_id` field referencing the coach's user ID.
2. Unified Architecture: `memberships` collection contains `assigned_coach_membership_id` linking the athlete's `membership_id` to the coach's `membership_id` within the same `organization_id`.
3. Coach fetches assigned athletes:
   * `membership_repository.get_memberships_by_org()` queries `memberships` for `{"organization_id": org_id, "assigned_coach_membership_id": coach_membership_id}`.
   * `athlete_repository.find_by_id()` queries `athletes` for `{"coach_id": coach_id}`.

### D. Workout Data Flow (Template → Assignment → Session → Performance Log)
1. **Workout Template**: Coach or admin creates a workout template stored in `workouts` (`workout_id`, `title`, `sport`, `category`, `difficulty`, `instructions`, `created_by`).
2. **Workout Assignment**: Coach assigns template to a training plan session. Stored in `workout_assignments` (`id`, `session_id`, `workout_template_id`, `category`, `order`, `overrides`).
3. **Workout Session**: Athlete starts executing assigned session. Stored in `workout_sessions` (`id`, `session_id`, `workout_template_id`, `assignment_id`, `athlete_id`, `status: "in_progress"`, `started_at`).
4. **Performance Log**: As athlete completes exercises, metric data points are saved to `performance_logs` (`id`, `workout_session_id`, `assignment_id`, `athlete_id`, `activity_label`, `metrics: {"sprint_time": 10.5, "weight": 100}`, `is_personal_record`).

### E. Organization Flow
1. Organization created in `organizations` (`organization_id`, `name`, `slug`, `owner_account_id`).
2. Subscription created in `subscriptions` (`subscription_id`, `organization_id`, `plan_tier`, `max_athletes`, `max_coaches`).
3. Users linked via `memberships` collection (`membership_id`, `account_id`, `organization_id`, `role_profile_id`, `role`, `status`).

---

## 6. Indexes

Based strictly on codebase inspection: **No custom secondary indexes are created in application code** (no `create_index()`, `create_indexes()`, or `ensure_index()` calls exist in any repository or startup script).

| Collection | Indexed Field(s) | Purpose |
| :--- | :--- | :--- |
| All 20 Collections | `_id` | Default MongoDB unique primary key index automatically created for every collection. |

*Note*: Field uniqueness (e.g. unique `email` check during registration, or unique `order` check within a session for `workout_assignments`) is managed programmatically in the application service layer.

---

## 7. Data Ownership & Isolation

AthliTech enforces multi-tenancy and data isolation at the **application and service layer**:

1. **JWT Context Extraction**: `get_current_user()` in `auth_service.py` decodes incoming JWT Bearer tokens and extracts `account_id`, `organization_id`, `membership_id`, and `active_roles`.
2. **Access Verification Functions**: Business services verify access before calling repositories:
   * `_verify_plan_access()` in `training_plan_service.py` verifies that the current user is an admin, the plan author (`created_by == user_id`), the assigned athlete (`athlete_id == user_id`), or the athlete's assigned coach (`athletes.coach_id == user_id`).
   * `delete_logs_by_session_id()` in `performance_log_repository.py` scopes delete operations to `{"workout_session_id": workout_session_id, "athlete_id": athlete_id}` to prevent cross-athlete data mutation.
3. **Repository Query Scoping**: All database queries explicitly include tenant/owner filter parameters (e.g., `{"organization_id": org_id}`, `{"athlete_id": athlete_id}`).

---

## 8. Database Access Layer Architecture

The database access layer follows a strict 4-tier pattern:

```
[FastAPI Route] (HTTP endpoint in routes/)
       │
       ▼
[Service Layer] (Business logic, access checks, Pydantic schema validation in services/)
       │
       ▼
[Repository Layer] (Query building, ObjectId parsing, serialization in repositories/)
       │
       ▼
[MongoDB Engine] (Motor AsyncIOMotorClient execution)
```

### Real Example: Workout Assignment Creation

1. **Route**: `POST /training-plans/assignments/` in [backend/routes/workout_assignment_routes.py](file:///home/vishwesh/athlitech-app/backend/routes/workout_assignment_routes.py) accepts `WorkoutAssignmentCreate` Pydantic model and injects `current_user`.
2. **Service**: `create_assignment()` in [backend/services/workout_assignment_service.py](file:///home/vishwesh/athlitech-app/backend/services/workout_assignment_service.py):
   * Calls `_verify_session_access()`, which traverses `session` → `day` → `week` → `plan` and executes `_verify_plan_access()`.
   * Calls `workout_repository.find_template_by_id()` to confirm the template exists.
   * Calls `workout_assignment_repository.find_assignment_by_session_and_order()` to check for order conflicts.
   * Constructs document dict with UUID string `id`.
3. **Repository**: `workout_assignment_repository.create_assignment()` in [backend/repositories/workout_assignment_repository.py](file:///home/vishwesh/athlitech-app/backend/repositories/workout_assignment_repository.py) calls `await self.collection.insert_one(doc)` targeting `db["workout_assignments"]`.
4. **MongoDB**: Motor asynchronously executes `insert_one` against MongoDB `athlitech.workout_assignments` collection.

---

## 9. Database Security

### What the Database Layer Handles
* **Transport Encryption**: TLS enabled via URI configuration (`tls=true`).
* **Credential Authentication**: Authenticates connection via `MONGODB_URI` (`MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`).
* **Safe ID Conversion**: BSON ObjectId parsing in `utils.to_object_id()` prevents malformed ObjectId query injection crashes.

### What the Database Layer DOES NOT Handle
* **RBAC & Authorization**: Role definitions (`admin`, `coach`, `athlete`), permissions checks (`has_permission()`), and route guards (`require_admin`, `require_coach_or_admin`) are executed entirely in Python FastAPI (`core/security.py`, `core/permissions.py`).
* **Document Validation**: Data validation is performed prior to database writes using Pydantic schemas (`backend/schemas/`). MongoDB server-side validation schemas are not configured.

---

## 10. Current Limitations & Future Scope

### Current Implementation Limitations
1. **Single-Index Dependency**: Entire database relies on default `_id` indexes; secondary indexes are not explicitly defined in code.
2. **Dual-Write Architecture**: Maintaining sync between legacy collections (`users`, `profiles`, `athletes`) and unified collections (`accounts`, `role_profiles`, `memberships`) requires dual-write logic in application code.
3. **No Database Transactions**: Cascade deletes (e.g., plan → week → day → session → assignment) and dual-writes are executed sequentially in application code without MongoDB multi-document ACID transactions.

### Future Scope
1. Define compound database indexes in code (e.g. `(organization_id, account_id)`, `(athlete_id, recorded_at)`).
2. Complete legacy data migration to rely single-source on the unified multi-tenant schema.
3. Implement Motor session transactions (`client.start_session()`) for atomic multi-document updates.

---

## 11. Mentor Review Q&A

**Q: Why was MongoDB chosen for AthliTech over a relational database like PostgreSQL?**  
*A:* AthliTech tracks dynamic, heterogeneous athletic performance metrics (e.g. sprint split times, 1RM weights, jump height, heart rate) that vary across sports and exercises. MongoDB's flexible schema allows storing arbitrary metric dictionaries without schema migrations. Complex periodized training plans and multi-role profiles also map naturally to JSON document trees.

**Q: Why use Motor instead of PyMongo or an ORM like Beanie/MongoEngine?**  
*A:* Motor provides non-blocking, asynchronous database I/O (`AsyncIOMotorClient`) that integrates natively with FastAPI's `asyncio` event loop. Using repositories with raw Motor collections and Pydantic schemas provides explicit query control without ORM overhead.

**Q: What is a document in AthliTech's database?**  
*A:* A BSON/JSON object stored inside a collection containing domain data fields (e.g. `account_id`, `email`, `metrics`), automatically assigned a unique BSON `_id` field by MongoDB.

**Q: How are relationships represented in MongoDB for AthliTech?**  
*A:* Through document references using string UUIDs or BSON ObjectId strings stored as document fields (e.g., `athlete_id`, `organization_id`, `workout_template_id`). They are application-managed references rather than database-enforced relational foreign keys.

**Q: Why use the Repository Pattern instead of querying collections directly in API routes?**  
*A:* The Repository pattern encapsulates data access logic, standardizes ObjectId parsing (`to_object_id`), normalizes document formatting (`serialize_doc`), decouples database technology from route logic, and enables clean unit testing.

**Q: Where is data validation performed?**  
*A:* Data validation is performed strictly at the application layer using Pydantic schemas (`backend/schemas/`) and domain models (`backend/models/`) before data reaches the repository layer.

**Q: How is organization data isolated in a multi-tenant setup?**  
*A:* Data isolation is enforced at the application/service layer. JWT tokens convey `organization_id` and `account_id`. Services verify access permissions (`_verify_plan_access`), and repositories filter queries by `organization_id`, `account_id`, or `athlete_id`.

**Q: How does a workout assignment connect to an athlete?**  
*A:* A `WorkoutAssignment` references a `Session` ID. The `Session` belongs to a `TrainingDay` → `TrainingWeek` → `TrainingPlan`. The `TrainingPlan` stores the `athlete_id`. Additionally, during live execution, a `WorkoutSession` directly connects `assignment_id` and `athlete_id`.

**Q: What happens when a referenced document does not exist (e.g., an assignment referencing a deleted workout template)?**  
*A:* Because MongoDB does not enforce relational foreign key constraints, the service layer explicitly checks for existence before performing actions (e.g. `workout_assignment_service.py` checks `find_template_by_id()` and raises HTTP 404 if missing).

---

## 12. Final Verification & Unverified Claims

* **Verified Collection Count**: 20 collections verified in [backend/database/mongodb.py](file:///home/vishwesh/athlitech-app/backend/database/mongodb.py).
* **Verified Connections**: `AsyncIOMotorClient` verified in [backend/database/mongodb.py](file:///home/vishwesh/athlitech-app/backend/database/mongodb.py), environment configuration verified in [backend/core/config.py](file:///home/vishwesh/athlitech-app/backend/core/config.py).
* **Verified Indexing Status**: Confirmed 0 custom `create_index` calls exist in codebase; default `_id` index is used exclusively.
* **Disproved Claims**:
  * *Claim*: Database enforces foreign keys or cascading deletes. → *Disproved*: Managed entirely in Python service code.
  * *Claim*: Database layer enforces RBAC permissions. → *Disproved*: Managed in FastAPI route dependencies and service logic.
