# AthliTech — Training System Architecture

This document serves as the official technical blueprint for the AthliTech Training System.

---

## 1. Overview & Hierarchy

The AthliTech Training System provides a hierarchical, multi-tiered structure for managing athletic development over time:

```
Training Plan (Macrocycle / Plan Level)
└── Training Week (Microcycle / Phase Level)
    └── Training Day (Daily Level Container)
        └── [Future: Workout Assignments & Session Logs]
```

### Hierarchy Breakdown
1. **Training Plan**: The top-level macrocycle container representing a complete training program (e.g., "12-Week Off-Season Velocity Program").
2. **Training Week**: A structured 7-day microcycle tag with target volume, intensity, and periodization phase (Base, Build, Peak, Deload).
3. **Training Day**: A single day container (Training, Recovery, Rest) that will house workout assignments in future phases.

---

## 2. Entity Specifications & Models

### A. Training Plan (`training_plans` collection)
- `id` (str, primary key)
- `title` (str, required)
- `description` (str, optional)
- `goal` (str, required)
- `athlete_id` (str, required)
- `created_by` (str, required, user ID)
- `owner_type` (str: `"self"` | `"coach"` | `"system"`)
- `start_date` (str, format YYYY-MM-DD)
- `end_date` (str, format YYYY-MM-DD)
- `status` (str: `"draft"` | `"active"` | `"completed"` | `"archived"`)
- `created_at` (datetime)
- `updated_at` (datetime)

### B. Training Week (`training_weeks` collection)
- `id` (str, primary key)
- `training_plan_id` (str, required, foreign key -> Training Plan)
- `week_number` (int, >= 1)
- `phase_tag` (str: `"Base"` | `"Build"` | `"Peak"` | `"Deload"`)
- `title` (str, required)
- `target_volume` (str/int, optional)
- `target_intensity` (str, optional)

### C. Training Day (`training_days` collection)
- `id` (str, primary key)
- `training_week_id` (str, required, foreign key -> Training Week)
- `date` (str, format YYYY-MM-DD)
- `day_name` (str, e.g. "Monday", "Day 1")
- `day_type` (str: `"Training"` | `"Recovery"` | `"Rest"`)
- `notes` (str, optional)

---

## 3. Permission & Authorization Matrix

| Action | Admin | Coach | Athlete |
| :--- | :--- | :--- | :--- |
| **Create Plan** | Full Access | Allowed for assigned athletes (`owner_type="coach"`) | Allowed for self (`athlete_id=self`, `owner_type="self"`) |
| **View Plan** | Full Access | Allowed for assigned athletes | Allowed for self |
| **Update Plan** | Full Access | Allowed for owned/assigned plans | Allowed for self-created plans |
| **Delete Plan** | Full Access | Allowed for owned plans | Allowed for self-created plans |
| **Manage Weeks/Days** | Full Access | Allowed for owned/assigned plans | Allowed for self-created plans |

---

## 4. Referential Integrity & Validation Rules

1. **Enum Validation**:
   - `phase_tag` MUST be one of: `Base`, `Build`, `Peak`, `Deload`.
   - `day_type` MUST be one of: `Training`, `Recovery`, `Rest`.
   - `status` MUST be one of: `draft`, `active`, `completed`, `archived`.
   - `owner_type` MUST be one of: `self`, `coach`, `system`.

2. **Parent Validation & Cascade Deletion**:
   - A `TrainingWeek` cannot be created without a valid existing `TrainingPlan`.
   - A `TrainingDay` cannot be created without a valid existing `TrainingWeek`.
   - Deleting a `TrainingPlan` cascade-deletes all associated `TrainingWeek` and `TrainingDay` records.
   - Deleting a `TrainingWeek` cascade-deletes all associated `TrainingDay` records.

---

## 5. Future Extensibility (Out of Scope for Phase 2)

Future development phases will attach entities to this foundation:
- **Phase 3**: Workout Assignment (attaching workout templates to Training Days).
- **Phase 4**: Session Execution & Logging (tracking completed exercises, RPE, and performance records).
- **Phase 5**: Analytics & Periodization AI (adaptive volume and intensity adjustments).
