"""CSP representation, variables, domains, and interval utilities for ResQ."""
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Optional, Tuple, Set
import uuid

from app.models.schemas import (
    Topic, FixedCommitment, DailyRoutine, PlanningSettings,
    StudySession, ScheduleRequest
)


class TimeSlot:
    """Represents a continuous candidate time interval."""
    def __init__(self, start_dt: datetime, end_dt: datetime, day_index: int):
        self.start_dt = start_dt
        self.end_dt = end_dt
        self.day_index = day_index

    @property
    def duration_hours(self) -> float:
        return (self.end_dt - self.start_dt).total_seconds() / 3600.0

    def overlaps_with(self, other: "TimeSlot", buffer_minutes: int = 0) -> bool:
        """Check if this slot overlaps another slot, considering an optional buffer."""
        buf = timedelta(minutes=buffer_minutes)
        # S1 starts before S2 ends + buf AND S2 starts before S1 ends + buf
        return (self.start_dt < other.end_dt + buf) and (other.start_dt < self.end_dt + buf)

    def overlaps_range(self, start: datetime, end: datetime) -> bool:
        """Check if this slot overlaps with an exact [start, end] window."""
        return (self.start_dt < end) and (start < self.end_dt)

    def __repr__(self) -> str:
        return f"Slot(D{self.day_index} {self.start_dt.strftime('%H:%M')}-{self.end_dt.strftime('%H:%M')})"

    def to_iso_tuple(self) -> Tuple[str, str]:
        return self.start_dt.isoformat(), self.end_dt.isoformat()


class CSPVariable:
    """Represents a study session or chunk to be scheduled."""
    def __init__(
        self,
        var_id: str,
        topic_id: str,
        name: str,
        subject: str,
        duration_hours: float,
        deadline_dt: datetime,
        priority: int,
        proficiency: str = "intermediate",
        is_revision: bool = False,
        requires_revision: bool = False,
        chunk_index: int = 1,
        total_chunks: int = 1,
        color: Optional[str] = None
    ):
        self.var_id = var_id
        self.topic_id = topic_id
        self.name = name
        self.subject = subject
        self.duration_hours = duration_hours
        self.deadline_dt = deadline_dt
        self.priority = priority
        self.proficiency = proficiency
        self.is_revision = is_revision
        self.requires_revision = requires_revision
        self.chunk_index = chunk_index
        self.total_chunks = total_chunks
        self.color = color
        
        # Initial and active domain of candidate TimeSlots
        self.domain: List[TimeSlot] = []

    @property
    def display_name(self) -> str:
        if self.total_chunks > 1:
            return f"{self.subject}: {self.name} (Part {self.chunk_index}/{self.total_chunks})"
        elif self.is_revision:
            return f"Revision: {self.subject} - {self.name}"
        return f"{self.subject}: {self.name}"

    def __repr__(self) -> str:
        return f"Var({self.display_name}, dur={self.duration_hours}h, domain_len={len(self.domain)})"


class CSPProblem:
    """Encapsulates the complete CSP scheduling problem."""
    def __init__(
        self,
        variables: List[CSPVariable],
        fixed_commitments: List[FixedCommitment],
        routine: DailyRoutine,
        settings: PlanningSettings,
        locked_sessions: Optional[List[StudySession]] = None
    ):
        self.variables = variables
        self.fixed_commitments = fixed_commitments
        self.routine = routine
        self.settings = settings
        self.locked_sessions = locked_sessions or []

        # Parsed fixed commitment intervals
        self.fixed_intervals: List[Tuple[datetime, datetime, str]] = []
        self._init_fixed_intervals()

    def _init_fixed_intervals(self):
        """Parse routine and explicit fixed commitments into concrete datetime intervals."""
        start_date_obj = date.fromisoformat(self.settings.start_date)
        
        # 1. Parse waking and sleeping hours for each day
        # Sleep from sleep_time (Day d) to wake_time (Day d+1), plus Day 1 pre-wake
        wake_h, wake_m = map(int, self.routine.wake_time.split(":"))
        sleep_h, sleep_m = map(int, self.routine.sleep_time.split(":"))

        for day_idx in range(1, self.settings.num_days + 1):
            curr_date = start_date_obj + timedelta(days=day_idx - 1)
            
            # Pre-wake sleep commitment: 00:00 to wake_time
            day_start = datetime.combine(curr_date, time(0, 0))
            wake_dt = datetime.combine(curr_date, time(wake_h, wake_m))
            if wake_dt > day_start:
                self.fixed_intervals.append((day_start, wake_dt, f"Sleep (Day {day_idx})"))

            # Post-sleep commitment: sleep_time to 23:59:59
            sleep_dt = datetime.combine(curr_date, time(sleep_h, sleep_m))
            day_end = datetime.combine(curr_date, time(23, 59, 59))
            if sleep_dt < day_end:
                self.fixed_intervals.append((sleep_dt, day_end, f"Sleep (Day {day_idx})"))

            # College commitment if this day is a college day
            if day_idx in self.routine.college_days:
                col_sh, col_sm = map(int, self.routine.college_start.split(":"))
                col_eh, col_em = map(int, self.routine.college_end.split(":"))
                c_start = datetime.combine(curr_date, time(col_sh, col_sm))
                c_end = datetime.combine(curr_date, time(col_eh, col_em))
                self.fixed_intervals.append((c_start, c_end, f"College / Classes (Day {day_idx})"))

            # Meals
            for meal in self.routine.meals:
                m_sh, m_sm = map(int, meal.start_time.split(":"))
                m_eh, m_em = map(int, meal.end_time.split(":"))
                m_start = datetime.combine(curr_date, time(m_sh, m_sm))
                m_end = datetime.combine(curr_date, time(m_eh, m_em))
                self.fixed_intervals.append((m_start, m_end, f"{meal.name} (Day {day_idx})"))

        # 2. Add explicit fixed commitments from request
        for fc in self.fixed_commitments:
            s_dt = datetime.fromisoformat(fc.start_time.replace("Z", "+00:00"))
            e_dt = datetime.fromisoformat(fc.end_time.replace("Z", "+00:00"))
            self.fixed_intervals.append((s_dt, e_dt, f"{fc.name} ({fc.category})"))

        # 3. Add exam commitment
        if self.settings.exam_datetime:
            exam_start = datetime.fromisoformat(self.settings.exam_datetime.replace("Z", "+00:00"))
            exam_end = exam_start + timedelta(hours=3)  # Standard 3 hour exam window
            self.fixed_intervals.append((exam_start, exam_end, "Final Examination"))


def create_csp_problem(
    topics: List[Topic],
    fixed_commitments: List[FixedCommitment],
    routine: DailyRoutine,
    settings: PlanningSettings,
    locked_sessions: Optional[List[StudySession]] = None
) -> CSPProblem:
    """
    Decompose topics into chunk variables, calculate candidate domains,
    prune invalid slots (deadlines, sleep, college, meals), and initialize CSP.
    """
    variables: List[CSPVariable] = []
    
    # Process each topic
    for topic in topics:
        if topic.completed:
            continue

        deadline_dt = datetime.fromisoformat(topic.deadline.replace("Z", "+00:00"))
        if getattr(topic, "exam_date", None):
            try:
                deadline_dt = datetime.fromisoformat(topic.exam_date.replace("Z", "+00:00"))
            except Exception:
                pass

        # Check if an explicit exam fixed commitment exists for this topic's subject
        for fc in fixed_commitments:
            if fc.category == "exam" and (
                topic.subject.lower() in fc.name.lower() or fc.name.lower() in topic.subject.lower()
            ):
                try:
                    fc_start = datetime.fromisoformat(fc.start_time.replace("Z", "+00:00"))
                    if fc_start < deadline_dt:
                        deadline_dt = fc_start
                except Exception:
                    pass

        dur = topic.duration_hours
        max_chunk = settings.max_chunk_hours
        min_chunk = settings.min_chunk_hours

        # Break duration into chunks: e.g. 3.0h with max 2.0h -> [2.0, 1.0] or 1.5 + 1.5
        chunks: List[float] = []
        remaining = dur
        while remaining > 0:
            if remaining <= max_chunk:
                chunks.append(remaining)
                remaining = 0
            else:
                chunk = min(max_chunk, remaining)
                # If remainder is less than min_chunk, split evenly
                if 0 < (remaining - chunk) < min_chunk:
                    chunk = round(remaining / 2.0, 2)
                    chunks.append(chunk)
                    chunks.append(round(remaining - chunk, 2))
                    remaining = 0
                else:
                    chunks.append(chunk)
                    remaining -= chunk

        proficiency = getattr(topic, "proficiency", "intermediate")
        effective_priority = topic.priority
        effective_requires_revision = topic.requires_revision

        if proficiency == "beginner":
            # Beginner needs earlier scheduling in high-alert slots and active revision
            effective_priority = min(5, topic.priority + 1)
            effective_requires_revision = True
        elif proficiency == "advanced":
            effective_priority = max(1, topic.priority - 1)

        total_chunks = len(chunks)
        for idx, chunk_dur in enumerate(chunks, start=1):
            var_id = f"{topic.id}_chunk_{idx}"
            var = CSPVariable(
                var_id=var_id,
                topic_id=topic.id,
                name=topic.name,
                subject=topic.subject,
                duration_hours=chunk_dur,
                deadline_dt=deadline_dt,
                priority=effective_priority,
                proficiency=proficiency,
                is_revision=topic.is_revision,
                requires_revision=effective_requires_revision,
                chunk_index=idx,
                total_chunks=total_chunks,
                color=topic.color
            )
            variables.append(var)

        # If effective_requires_revision is True and not already marked is_revision, add a 1h revision chunk
        if effective_requires_revision and not topic.is_revision:
            rev_var = CSPVariable(
                var_id=f"{topic.id}_revision",
                topic_id=topic.id,
                name=f"{topic.name} [Revision]",
                subject=topic.subject,
                duration_hours=1.0,
                deadline_dt=deadline_dt,
                priority=effective_priority,
                proficiency=proficiency,
                is_revision=True,
                requires_revision=False,
                chunk_index=1,
                total_chunks=1,
                color=topic.color
            )
            variables.append(rev_var)

    problem = CSPProblem(
        variables=variables,
        fixed_commitments=fixed_commitments,
        routine=routine,
        settings=settings,
        locked_sessions=locked_sessions
    )

    # Generate initial candidate domains for each variable
    generate_initial_domains(problem)

    return problem


def generate_initial_domains(problem: CSPProblem):
    """
    Generate valid discrete time slots for each CSP variable.
    Ensures slot does not overlap fixed commitments or exceed the variable's deadline.
    """
    start_date_obj = date.fromisoformat(problem.settings.start_date)
    slot_step_minutes = problem.settings.slot_duration_minutes  # default 60 min
    
    wake_h, wake_m = map(int, problem.routine.wake_time.split(":"))
    sleep_h, sleep_m = map(int, problem.routine.sleep_time.split(":"))

    # If there are locked sessions, add them as fixed blocks so new sessions don't conflict
    locked_intervals: List[Tuple[datetime, datetime]] = []
    for ls in problem.locked_sessions:
        s = datetime.fromisoformat(ls.start_time.replace("Z", "+00:00"))
        e = datetime.fromisoformat(ls.end_time.replace("Z", "+00:00"))
        locked_intervals.append((s, e))

    for var in problem.variables:
        var_domain: List[TimeSlot] = []
        var_dur_delta = timedelta(hours=var.duration_hours)

        for day_idx in range(1, problem.settings.num_days + 1):
            curr_date = start_date_obj + timedelta(days=day_idx - 1)
            
            # Day active window: wake_time to sleep_time
            curr_dt = datetime.combine(curr_date, time(wake_h, wake_m))
            sleep_dt = datetime.combine(curr_date, time(sleep_h, sleep_m))

            while curr_dt + var_dur_delta <= sleep_dt:
                slot_end = curr_dt + var_dur_delta
                candidate = TimeSlot(start_dt=curr_dt, end_dt=slot_end, day_index=day_idx)

                # Check 1: Does candidate slot end before or at topic deadline?
                if slot_end > var.deadline_dt:
                    curr_dt += timedelta(minutes=slot_step_minutes)
                    continue

                # Check 2: Does candidate slot overlap any fixed commitment?
                conflict = False
                for f_start, f_end, _ in problem.fixed_intervals:
                    if candidate.overlaps_range(f_start, f_end):
                        conflict = True
                        break

                if conflict:
                    curr_dt += timedelta(minutes=slot_step_minutes)
                    continue

                # Check 3: Does candidate slot overlap any locked session?
                for l_start, l_end in locked_intervals:
                    if candidate.overlaps_range(l_start, l_end):
                        conflict = True
                        break

                if not conflict:
                    var_domain.append(candidate)

                curr_dt += timedelta(minutes=slot_step_minutes)

        var.domain = var_domain
