"""Independent hard-constraint validator for ResQ study schedules."""
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from collections import defaultdict

from app.models.schemas import (
    StudySession, Topic, FixedCommitment, PlanningSettings, ValidationResult
)


class ScheduleValidator:
    """
    Independently inspects and validates a generated schedule against all hard constraints.
    Zero hard-constraint violations are required for a schedule to be certified feasible.
    """
    def __init__(
        self,
        sessions: List[StudySession],
        topics: List[Topic],
        fixed_commitments: List[FixedCommitment],
        settings: PlanningSettings
    ):
        self.sessions = sessions
        self.topics = {t.id: t for t in topics}
        self.fixed_commitments = fixed_commitments
        self.settings = settings
        self.violations: List[str] = []
        self.warnings: List[str] = []

    def validate(self) -> ValidationResult:
        """Execute full validation suite."""
        self.violations = []
        self.warnings = []

        study_sessions = [s for s in self.sessions if s.session_type in ["study", "revision"]]

        # 1. Check pairwise overlap among study sessions
        self._check_session_overlaps(study_sessions)

        # 2. Check overlap with fixed commitments
        self._check_fixed_commitment_clashes(study_sessions)

        # 3. Check topic deadline compliance
        self._check_deadline_compliance(study_sessions)

        # 4. Check total topic durations (no silent loss of study time)
        self._check_duration_completeness(study_sessions)

        # 5. Check revision ordering
        self._check_revision_ordering(study_sessions)

        is_valid = len(self.violations) == 0

        return ValidationResult(
            is_valid=is_valid,
            hard_constraint_violations=len(self.violations),
            violations=self.violations,
            warnings=self.warnings,
            details={
                "total_study_sessions": len(study_sessions),
                "total_topics_checked": len(self.topics),
                "total_fixed_commitments": len(self.fixed_commitments)
            }
        )

    def _check_session_overlaps(self, sessions: List[StudySession]):
        """Ensure no two study sessions overlap in time."""
        for i in range(len(sessions)):
            s1 = sessions[i]
            s1_start = datetime.fromisoformat(s1.start_time.replace("Z", "+00:00"))
            s1_end = datetime.fromisoformat(s1.end_time.replace("Z", "+00:00"))

            if s1_end <= s1_start:
                self.violations.append(
                    f"Session '{s1.title}' has invalid duration (end {s1.end_time} <= start {s1.start_time})"
                )

            for j in range(i + 1, len(sessions)):
                s2 = sessions[j]
                s2_start = datetime.fromisoformat(s2.start_time.replace("Z", "+00:00"))
                s2_end = datetime.fromisoformat(s2.end_time.replace("Z", "+00:00"))

                # Overlap condition: start1 < end2 AND start2 < end1
                if (s1_start < s2_end) and (s2_start < s1_end):
                    self.violations.append(
                        f"Hard Constraint Violation: Study sessions overlap! "
                        f"'{s1.title}' ({s1.start_time} - {s1.end_time}) clashes with "
                        f"'{s2.title}' ({s2.start_time} - {s2.end_time})"
                    )

    def _check_fixed_commitment_clashes(self, sessions: List[StudySession]):
        """Ensure no study session overlaps with any fixed commitment."""
        for s in sessions:
            s_start = datetime.fromisoformat(s.start_time.replace("Z", "+00:00"))
            s_end = datetime.fromisoformat(s.end_time.replace("Z", "+00:00"))

            for fc in self.fixed_commitments:
                fc_start = datetime.fromisoformat(fc.start_time.replace("Z", "+00:00"))
                fc_end = datetime.fromisoformat(fc.end_time.replace("Z", "+00:00"))

                if (s_start < fc_end) and (fc_start < s_end):
                    self.violations.append(
                        f"Hard Constraint Violation: Session '{s.title}' overlaps with fixed commitment "
                        f"'{fc.name}' ({fc.start_time} - {fc.end_time})"
                    )

    def _check_deadline_compliance(self, sessions: List[StudySession]):
        """Ensure every study session finishes before or at its topic's deadline."""
        for s in sessions:
            if not s.topic_id or s.topic_id not in self.topics:
                continue
            topic = self.topics[s.topic_id]
            topic_deadline = datetime.fromisoformat(topic.deadline.replace("Z", "+00:00"))
            s_end = datetime.fromisoformat(s.end_time.replace("Z", "+00:00"))

            if s_end > topic_deadline:
                self.violations.append(
                    f"Hard Constraint Violation: Session '{s.title}' ends at {s.end_time}, "
                    f"which violates topic deadline {topic.deadline}"
                )

    def _check_duration_completeness(self, sessions: List[StudySession]):
        """Verify that all topics have their required durations fully scheduled."""
        scheduled_durations: Dict[str, float] = defaultdict(float)
        for s in sessions:
            if s.topic_id and s.session_type == "study":
                scheduled_durations[s.topic_id] += s.duration_hours

        for topic_id, topic in self.topics.items():
            if topic.completed or topic.is_revision:
                continue
            sched = round(scheduled_durations[topic_id], 2)
            req = round(topic.duration_hours, 2)
            if sched < req:
                self.violations.append(
                    f"Duration Incompleteness: Topic '{topic.name}' requires {req}h of study, "
                    f"but only {sched}h was scheduled (missing {round(req - sched, 2)}h)"
                )

    def _check_revision_ordering(self, sessions: List[StudySession]):
        """Ensure revisions happen strictly after their topic's study sessions."""
        topic_study_ends: Dict[str, datetime] = {}
        revision_starts: Dict[str, datetime] = {}

        for s in sessions:
            if not s.topic_id:
                continue
            s_start = datetime.fromisoformat(s.start_time.replace("Z", "+00:00"))
            s_end = datetime.fromisoformat(s.end_time.replace("Z", "+00:00"))

            if s.session_type == "study":
                if s.topic_id not in topic_study_ends or s_end > topic_study_ends[s.topic_id]:
                    topic_study_ends[s.topic_id] = s_end
            elif s.session_type == "revision":
                if s.topic_id not in revision_starts or s_start < revision_starts[s.topic_id]:
                    revision_starts[s.topic_id] = s_start

        for topic_id, rev_start in revision_starts.items():
            if topic_id in topic_study_ends:
                study_end = topic_study_ends[topic_id]
                if rev_start < study_end:
                    self.violations.append(
                        f"Hard Constraint Violation: Revision for topic '{topic_id}' starts at {rev_start}, "
                        f"which is before topic study completion at {study_end}"
                    )
