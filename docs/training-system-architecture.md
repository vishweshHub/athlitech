# AthliTech — Training System Architecture (Session-Based Model)

This document serves as the official canonical blueprint for the AthliTech Training System. All backend services, database schemas, and frontend interfaces must strictly conform to this architecture.

---

## 1. Complete System Hierarchy

The AthliTech Training System is built on a multi-tiered, session-based model that separates **planned training structures** from **execution & completion logs**:

```
Training Plan (Macrocycle / Plan Level)
↓
Training Week (Microcycle / Periodization Phase)
↓
Training Day (Daily Schedule Container)
↓
Session (Planned Session Entity, e.g., Morning Track / Evening Gym)
↓
Workout Assignment (Link to Workout Template with custom overrides & category)
↓
Workout Template (Reusable catalog exercise/workout specification)
↓
Workout Session (Execution Record — Live/Completed workout instance)
↓
Workout History (Historical log of completed workouts)
↓
Performance Log (Telemetry, PRs, RPE, and performance metrics)
```

---

## 2. Entity Relationships & Specifications

### A. Training Plan (`training_plans` collection)
The top-level macrocycle container representing a complete multi-week athletic program.
- `id` (str, primary key)
- `title` (str, required)
- `description` (str, optional)
- `goal` (str, required)
- `athlete_id` (str, required, user ID)
- `created_by` (str, required, user ID)
- `owner_type` (str: `"self"` | `"coach"` | `"system"`)
- `start_date` (str, format YYYY-MM-DD)
- `end_date` (str, format YYYY-MM-DD)
- `status` (str: `"draft"` | `"active"` | `"completed"` | `"archived"`)
- `created_at` (datetime)
- `updated_at` (datetime)

### B. Training Week (`training_weeks` collection)
A 7-day microcycle block defining periodization phase and target load.
- `id` (str, primary key)
- `training_plan_id` (str, required, foreign key -> Training Plan)
- `week_number` (int, >= 1)
- `phase_tag` (str: `"Base"` | `"Build"` | `"Peak"` | `"Deload"`)
- `title` (str, required)
- `target_volume` (str/int, optional)
- `target_intensity` (str, optional)

### C. Training Day (`training_days` collection)
A single day container within a Training Week.
> **Architectural Constraint**: Training Day contains ONLY the day metadata and associated `Sessions`. Warm-up, Main Session, Gym, or Recovery are **NOT** modeled as fixed fields on `Training Day`.
- `id` (str, primary key)
- `training_week_id` (str, required, foreign key -> Training Week)
- `date` (str, format YYYY-MM-DD)
- `day_name` (str, e.g. "Monday", "Day 1")
- `day_type` (str: `"Training"` | `"Recovery"` | `"Rest"`)
- `coach_note` (str, optional — daily guidance/instructions for the athlete)
- `sessions` (list of `Session` entities)

### D. Session (`sessions` collection / embedded)
First-class planned session entity representing a distinct training block within a Training Day (e.g., "Morning Velocity Track Session", "Afternoon Hypertrophy Session").
- `id` (str, primary key)
- `training_day_id` (str, required, foreign key -> Training Day)
- `session_name` (str, required, e.g. "Morning Track Session")
- `session_type` (str, e.g. "Speed", "Strength", "Mobility", "Recovery")
- `order_index` (int, default 1 — order of session within the day)
- `notes` (str, optional — session-specific instructions)
- `assignments` (list of `Workout Assignment` entities)

### E. Workout Assignment (`workout_assignments` collection / embedded)
Connects a planned `Session` to a reusable `Workout Template` with athlete-specific parameters and categorizations.
- `id` (str, primary key)
- `session_id` (str, required, foreign key -> Session)
- `workout_template_id` (str, required, reference -> Workout Template)
- `category` (str, required: `"warm-up"` | `"drill"` | `"main"` | `"strength"` | `"recovery"`, etc.)
- `overrides` (dict, optional — set/rep/intensity/duration adjustments override template defaults)
- `assignment_note` (str, optional — target focus, e.g. "Focus on triple extension")
- `order_index` (int, default 1 — ordering within the session)

> **Architectural Constraint**: Categories (`warm-up`, `drill`, `main`, `strength`, `recovery`) define assignment behavior. They are **NOT** separate database entities.

### F. Workout Template (`workouts` collection)
Reusable exercise template catalog (e.g., "100m Explosive Block Acceleration").
- `id` (str, primary key)
- `title` (str, required)
- `sport` (str, required)
- `category` (str, required)
- `difficulty` (str, required)
- `duration_minutes` (int)
- `equipment` (list of str)
- `instructions` (str)

### G. Workout Session (`workout_sessions` collection) — Execution Record
Represents the actual live or recorded execution instance when an athlete performs a workout.
> **Critical Architectural Rule**: `Workout Session` (the execution record) is kept strictly separate from `Session` (the planned container). They are **NEVER** merged into a single entity.

### H. Workout History & Performance Log
Analytical metrics, PRs, velocity tracking, and RPE logs derived from completed `Workout Sessions`.

---

## 3. UI Rendering & Frontend Layout Architecture

1. **Dynamic Grouping by Category**:
   - The backend stores only Assignment `category` strings (`warm-up`, `drill`, `main`, `strength`, `recovery`).
   - At render time, the frontend interface groups `Workout Assignments` dynamically under category headers within each `Session`.

2. **Sport-Agnostic Extensibility**:
   - By eliminating fixed fields (like "Gym" or "Warmup") from `Training Day`, the system cleanly accommodates any sport (Track & Field, Football, Basketball, Cricket, Weightlifting) without schema migration or code duplication.

---

## 4. Permission & Authorization Matrix

| Action | Admin | Coach | Athlete |
| :--- | :--- | :--- | :--- |
| **Create Plan** | Full Access | Allowed for assigned athletes (`owner_type="coach"`) | Allowed for self (`athlete_id=self`, `owner_type="self"`) |
| **View Plan** | Full Access | Allowed for assigned athletes | Allowed for self |
| **Update Plan** | Full Access | Allowed for owned/assigned plans | Allowed for self-created plans |
| **Delete Plan** | Full Access | Allowed for owned plans | Allowed for self-created plans |
| **Manage Sessions & Assignments** | Full Access | Allowed for owned/assigned plans | Allowed for self-created plans |

---

## 5. Referential Integrity & Validation Rules

1. **Enum & Field Validation**:
   - `phase_tag` MUST be one of: `Base`, `Build`, `Peak`, `Deload`.
   - `day_type` MUST be one of: `Training`, `Recovery`, `Rest`.
   - `status` MUST be one of: `draft`, `active`, `completed`, `archived`.
   - `owner_type` MUST be one of: `self`, `coach`, `system`.
   - Assignment `category` MUST be a valid string (`warm-up`, `drill`, `main`, `strength`, `recovery`).

2. **Parent Validation & Cascade Deletion**:
   - A `TrainingWeek` cannot exist without a valid `TrainingPlan`.
   - A `TrainingDay` cannot exist without a valid `TrainingWeek`.
   - A `Session` cannot exist without a valid `TrainingDay`.
   - A `WorkoutAssignment` cannot exist without a valid `Session` and `WorkoutTemplate`.
   - Deleting a parent container (`TrainingPlan`, `TrainingWeek`, `TrainingDay`, or `Session`) cascade-deletes all child entities.

---

## 6. MVP Scope Breakdown

- **Included in MVP Scope**:
  - `Training Plan`
  - `Training Week`
  - `Training Day`
  - `Session` (Planned Container)
  - `Workout Assignment`
  - `Workout Template`
- **Separated & Deferred to Execution Phase**:
  - `Workout Session` (Live/Recorded Execution Instance)
  - `Workout History` & `Performance Log`
