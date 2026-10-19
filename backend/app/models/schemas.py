"""Pydantic models and schemas for ResQ Study Planner."""
from datetime import datetime, date, time
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class MealInterval(BaseModel):
    name: str = "Meal"
    start_time: str = "13:00"  # "HH:MM"
    end_time: str = "14:00"    # "HH:MM"

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        try:
            parts = v.split(":")
            if len(parts) != 2:
                raise ValueError
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError
        except Exception:
            raise ValueError(f"Time '{v}' must be in HH:MM format (00:00 to 23:59)")
        return v


class StudyWindow(BaseModel):
    """Optional preferred study window for soft constraints."""
    start_time: str = "15:00"
    end_time: str = "22:00"
    preference_weight: float = 1.0  # Higher means more preferred


class Topic(BaseModel):
    id: str
    name: str = Field(..., min_length=1, description="Topic name")
    subject: str = Field(..., min_length=1, description="Subject name")
    duration_hours: float = Field(..., gt=0, le=24, description="Required study duration in hours")
    priority: int = Field(default=3, ge=1, le=5, description="Priority from 1 (low) to 5 (high)")
    deadline: str = Field(..., description="ISO 8601 deadline datetime string, e.g. 2026-10-23T09:00:00")
    is_revision: bool = Field(default=False, description="Whether this topic is purely a revision session")
    requires_revision: bool = Field(default=False, description="Whether a 1-hour revision session must be scheduled after completion")
    completed: bool = Field(default=False, description="Whether topic is already completed")
    color: Optional[str] = Field(default=None, description="Hex color or tag color")

    @field_validator("deadline")
    @classmethod
    def validate_deadline_format(cls, v: str) -> str:
        try:
            # Accepts ISO format
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError(f"Deadline '{v}' must be a valid ISO 8601 datetime string, e.g. '2026-10-23T09:00:00'")
        return v


class FixedCommitment(BaseModel):
    id: str
    name: str = Field(..., min_length=1)
    category: Literal["college", "meal", "sleep", "exam", "break", "other"] = "other"
    start_time: str = Field(..., description="ISO 8601 datetime string")
    end_time: str = Field(..., description="ISO 8601 datetime string")
    day_index: Optional[int] = Field(default=None, ge=1, description="Optional 1-based day index")

    @model_validator(mode="after")
    def validate_times(self) -> "FixedCommitment":
        try:
            s = datetime.fromisoformat(self.start_time.replace("Z", "+00:00"))
            e = datetime.fromisoformat(self.end_time.replace("Z", "+00:00"))
            if e <= s:
                raise ValueError("end_time must be strictly after start_time")
        except ValueError as err:
            raise ValueError(f"Invalid fixed commitment time interval: {err}")
        return self


class DailyRoutine(BaseModel):
    wake_time: str = Field(default="07:00", description="Daily wake-up time HH:MM")
    sleep_time: str = Field(default="22:30", description="Daily sleep time HH:MM")
    college_days: List[int] = Field(default=[1, 2], description="1-based day indices with college/classes")
    college_start: str = Field(default="08:00", description="College start time HH:MM")
    college_end: str = Field(default="14:00", description="College end time HH:MM")
    meals: List[MealInterval] = Field(
        default_factory=lambda: [
            MealInterval(name="Lunch", start_time="13:00", end_time="14:00"),
            MealInterval(name="Dinner", start_time="20:00", end_time="21:00"),
        ]
    )
    preferred_study_windows: List[StudyWindow] = Field(default_factory=list)
    min_break_minutes: int = Field(default=15, ge=0, le=120, description="Minimum buffer minutes between study sessions")


class PlanningSettings(BaseModel):
    start_date: str = Field(default="2026-10-20", description="YYYY-MM-DD starting date")
    num_days: int = Field(default=4, ge=1, le=14, description="Planning horizon in days")
    slot_duration_minutes: int = Field(default=60, ge=30, le=120, description="Slot size in minutes (e.g. 60 or 30)")
    max_chunk_hours: float = Field(default=2.0, ge=0.5, le=4.0, description="Max continuous study block per topic")
    min_chunk_hours: float = Field(default=1.0, ge=0.5, le=2.0, description="Min chunk duration")
    exam_datetime: str = Field(default="2026-10-23T09:00:00", description="Exam datetime ISO 8601")
    max_backtracks: int = Field(default=5000, ge=100, le=50000, description="Search limit to prevent infinite loops")
    search_timeout_seconds: float = Field(default=5.0, ge=0.5, le=30.0, description="Solver timeout in seconds")

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError(f"start_date '{v}' must be YYYY-MM-DD")
        return v


class StudySession(BaseModel):
    id: str
    topic_id: Optional[str] = None
    subject: str
    title: str
    start_time: str  # ISO 8601
    end_time: str    # ISO 8601
    day_index: int   # 1-based day index
    duration_hours: float
    session_type: Literal["study", "revision", "break", "fixed"] = "study"
    is_locked: bool = False
    completed: bool = False
    color: Optional[str] = None


class SolverEvent(BaseModel):
    step: int
    event_type: Literal[
        "variable_selected",
        "slot_considered",
        "constraint_violated",
        "backtrack",
        "assignment_accepted",
        "solution_found",
        "infeasible",
        "search_limit"
    ]
    variable_name: Optional[str] = None
    slot_description: Optional[str] = None
    reason: Optional[str] = None
    timestamp_ms: float = 0.0


class SolverStats(BaseModel):
    total_variables: int = 0
    assignments_attempted: int = 0
    backtracks: int = 0
    elapsed_time_ms: float = 0.0
    search_limit_reached: bool = False
    status: Literal["FEASIBLE", "INFEASIBLE", "SEARCH_LIMIT_REACHED"] = "FEASIBLE"


class ScheduleRequest(BaseModel):
    topics: List[Topic]
    fixed_commitments: List[FixedCommitment] = Field(default_factory=list)
    routine: DailyRoutine = Field(default_factory=DailyRoutine)
    settings: PlanningSettings = Field(default_factory=PlanningSettings)


class ScheduleResponse(BaseModel):
    success: bool
    status: Literal["FEASIBLE", "INFEASIBLE", "SEARCH_LIMIT_REACHED"]
    sessions: List[StudySession] = Field(default_factory=list)
    stats: SolverStats = Field(default_factory=SolverStats)
    events: List[SolverEvent] = Field(default_factory=list)
    total_required_hours: float = 0.0
    total_scheduled_hours: float = 0.0
    available_study_hours: float = 0.0
    unscheduled_topics: List[str] = Field(default_factory=list)
    infeasibility_reason: Optional[str] = None
    bottleneck_analysis: Optional[str] = None
    suggestions: List[str] = Field(default_factory=list)


class ReplanRequest(BaseModel):
    topics: List[Topic]
    fixed_commitments: List[FixedCommitment] = Field(default_factory=list)
    routine: DailyRoutine = Field(default_factory=DailyRoutine)
    settings: PlanningSettings = Field(default_factory=PlanningSettings)
    locked_sessions: List[StudySession] = Field(default_factory=list)


class ValidateRequest(BaseModel):
    sessions: List[StudySession]
    topics: List[Topic]
    fixed_commitments: List[FixedCommitment] = Field(default_factory=list)
    settings: PlanningSettings = Field(default_factory=PlanningSettings)


class ValidationResult(BaseModel):
    is_valid: bool
    hard_constraint_violations: int
    violations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    details: Dict[str, Any] = Field(default_factory=dict)


class DemoScenario(BaseModel):
    id: str
    name: str
    description: str
    badge: str
    request: ScheduleRequest
