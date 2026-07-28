// User & Auth Types
export type UserRole = 'athlete' | 'coach' | 'admin';

export interface User {
  id: string;
  email: string;

  name: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Training Plan & Today's Training Types
export interface TemplateInfo {
  id: string;
  title: string;
  description?: string;
  sport: string;
  category: string;
  difficulty?: string;
  exercises?: any[];
}

export interface TodayAssignment {
  id: string;
  session_id: string;
  workout_template_id: string;
  category: string;
  order: number;
  assignment_note?: string;
  overrides?: Record<string, any>;
  workout_template?: TemplateInfo;
}

export interface TodaySession {
  id: string;
  training_day_id: string;
  session_name: string;
  order: number;
  start_time?: string;
  end_time?: string;
  assignments: TodayAssignment[];
}

export interface TodayPlanSummary {
  id: string;
  title: string;
  goal?: string;
}

export interface TodayWeekSummary {
  id: string;
  week_number: number;
  title?: string;
  phase_tag?: string;
}

export interface TodayDaySummary {
  id: string;
  date: string;
  day_name?: string;
  day_type?: string;
}

export interface TodayTrainingResponse {
  has_training: boolean;
  status: string;
  message?: string;
  training_plan?: TodayPlanSummary;
  training_week?: TodayWeekSummary;
  training_day?: TodayDaySummary;
  sessions: TodaySession[];
}

// Workout Session Types
export type WorkoutSessionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface WorkoutSession {
  id: string;
  session_id?: string;
  workout_template_id?: string;
  assignment_id?: string;
  athlete_id: string;
  source_type?: 'PLANNED' | 'SELF';
  status: WorkoutSessionStatus;
  started_at: string;
  paused_at?: string;
  resumed_at?: string;
  completed_at?: string;
  total_duration_seconds: number;
  completion_percentage: number;
  session_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionStartRequest {
  session_id?: string;
  workout_template_id?: string;
  assignment_id?: string;
  session_notes?: string;
}


export interface WorkoutSessionCompleteRequest {
  completion_percentage?: number;
  session_notes?: string;
}

export interface WorkoutSessionCancelRequest {
  session_notes?: string;
}

// Metric Definition & Performance Log Types
export type BetterDirection = 'higher' | 'lower' | 'equal';

export interface MetricDefinition {
  id: string;
  metric_key: string;
  display_name: string;
  unit: string;
  data_type: string;
  better_direction: BetterDirection;
  sport?: string;
  created_at?: string;
  updated_at?: string;
}

export type SourceType = 'manual' | 'coach' | 'wearable' | 'ai';

export interface PerformanceLog {
  id: string;
  workout_session_id: string;
  assignment_id: string;
  athlete_id: string;
  activity_label: string;
  metrics: Record<string, any>;
  source_type: SourceType;
  notes?: string;
  is_personal_record: boolean;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceLogCreateRequest {
  workout_session_id: string;
  assignment_id: string;
  activity_label: string;
  metrics: Record<string, any>;
  source_type?: SourceType;
  notes?: string;
  recorded_at?: string;
}

// Activity Feed Types
export interface HeadlineMetric {
  label: string;
  value: number | string;
  unit: string;
}

export interface ActivityFeedSessionCard {
  workout_session_id: string;
  title: string;
  sport: string;
  status: string;
  completion_percentage: number;
  duration_minutes: number;
  headline_metrics: HeadlineMetric[];
  badges: string[];
}

export interface ActivityFeedDayGroup {
  date: string;
  gap_days_before: number;
  sessions_completed: number;
  sessions_planned: number;
  sessions: ActivityFeedSessionCard[];
}

export interface ActivityFeedResponse {
  days: ActivityFeedDayGroup[];
  next_cursor?: string;
}

// Saved Workouts Types
export interface SavedWorkoutItem {
  id: string;
  athlete_id: string;
  workout_template_id: string;
  created_at: string;
  workout_template?: TemplateInfo | any;
}

