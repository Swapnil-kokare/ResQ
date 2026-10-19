"""Unit tests for the independent Hard Constraint Validator."""
from app.models.schemas import StudySession, Topic, FixedCommitment, PlanningSettings
from app.solver.validator import ScheduleValidator


def test_validator_detects_session_overlap():
    topic = Topic(
        id="t1", name="Math", subject="Math", duration_hours=2.0,
        priority=3, deadline="2026-10-22T22:00:00"
    )
    s1 = StudySession(
        id="s1", topic_id="t1", subject="Math", title="Math 1",
        start_time="2026-10-20T14:00:00", end_time="2026-10-20T16:00:00",
        day_index=1, duration_hours=2.0, session_type="study"
    )
    s2 = StudySession(
        id="s2", topic_id="t1", subject="Math", title="Math 2",
        start_time="2026-10-20T15:00:00", end_time="2026-10-20T17:00:00",  # Clashes with s1
        day_index=1, duration_hours=2.0, session_type="study"
    )

    validator = ScheduleValidator(
        sessions=[s1, s2],
        topics=[topic],
        fixed_commitments=[],
        settings=PlanningSettings()
    )
    res = validator.validate()
    assert res.is_valid is False
    assert res.hard_constraint_violations > 0
    assert any("overlap" in v.lower() for v in res.violations)


def test_validator_detects_fixed_commitment_clash():
    topic = Topic(
        id="t1", name="Math", subject="Math", duration_hours=2.0,
        priority=3, deadline="2026-10-22T22:00:00"
    )
    study = StudySession(
        id="s1", topic_id="t1", subject="Math", title="Math",
        start_time="2026-10-20T09:00:00", end_time="2026-10-20T11:00:00",
        day_index=1, duration_hours=2.0, session_type="study"
    )
    college = FixedCommitment(
        id="c1", name="College Lecture", category="college",
        start_time="2026-10-20T08:00:00", end_time="2026-10-20T14:00:00"
    )

    validator = ScheduleValidator(
        sessions=[study],
        topics=[topic],
        fixed_commitments=[college],
        settings=PlanningSettings()
    )
    res = validator.validate()
    assert res.is_valid is False
    assert any("fixed commitment" in v.lower() for v in res.violations)


def test_validator_detects_deadline_violation():
    topic = Topic(
        id="t1", name="Math", subject="Math", duration_hours=2.0,
        priority=3, deadline="2026-10-20T12:00:00"  # Deadline noon
    )
    study = StudySession(
        id="s1", topic_id="t1", subject="Math", title="Math",
        start_time="2026-10-20T14:00:00", end_time="2026-10-20T16:00:00",  # Afternoon after deadline
        day_index=1, duration_hours=2.0, session_type="study"
    )

    validator = ScheduleValidator(
        sessions=[study],
        topics=[topic],
        fixed_commitments=[],
        settings=PlanningSettings()
    )
    res = validator.validate()
    assert res.is_valid is False
    assert any("deadline" in v.lower() for v in res.violations)


def test_validator_certifies_valid_schedule():
    topic = Topic(
        id="t1", name="Math", subject="Math", duration_hours=2.0,
        priority=3, deadline="2026-10-22T22:00:00"
    )
    study = StudySession(
        id="s1", topic_id="t1", subject="Math", title="Math",
        start_time="2026-10-20T15:00:00", end_time="2026-10-20T17:00:00",
        day_index=1, duration_hours=2.0, session_type="study"
    )

    validator = ScheduleValidator(
        sessions=[study],
        topics=[topic],
        fixed_commitments=[],
        settings=PlanningSettings()
    )
    res = validator.validate()
    assert res.is_valid is True
    assert res.hard_constraint_violations == 0
