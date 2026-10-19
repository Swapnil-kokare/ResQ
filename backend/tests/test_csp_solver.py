"""Unit tests for the CSP Backtracking solver with MRV and Forward Checking."""
import pytest
from datetime import datetime

from app.models.schemas import Topic, PlanningSettings, DailyRoutine, StudySession
from app.solver.csp import create_csp_problem
from app.solver.backtracking import CSPSolver
from app.api.demo_data import get_base_routine, get_base_settings, get_feasible_topics


def test_feasible_problem_solution():
    """Verify that the standard college project exam scenario generates a feasible schedule."""
    topics = get_feasible_topics()
    routine = get_base_routine()
    settings = get_base_settings()

    problem = create_csp_problem(topics, [], routine, settings)
    assert len(problem.variables) > 0

    solver = CSPSolver(problem)
    success, assignment, stats, events = solver.solve()

    assert success is True
    assert stats.status == "FEASIBLE"
    assert len(assignment) == len(problem.variables)
    assert stats.assignments_attempted > 0
    assert stats.backtracks >= 0

    # Ensure all assigned slots are non-overlapping
    slots = list(assignment.values())
    for i in range(len(slots)):
        for j in range(i + 1, len(slots)):
            s1 = slots[i]
            s2 = slots[j]
            # Check overlap
            overlap = (s1.start_dt < s2.end_dt) and (s2.start_dt < s1.end_dt)
            assert not overlap, f"Assigned slots overlap: {s1} and {s2}"


def test_topic_chunking():
    """Verify that a 3.0-hour topic is decomposed into sub-chunks respecting max_chunk_hours=2.0."""
    topics = [
        Topic(
            id="t1",
            name="Calculus",
            subject="Math",
            duration_hours=3.0,
            priority=5,
            deadline="2026-10-23T08:00:00"
        )
    ]
    routine = get_base_routine()
    settings = get_base_settings()
    settings.max_chunk_hours = 2.0

    problem = create_csp_problem(topics, [], routine, settings)
    # 3.0h split into 2.0h + 1.0h or 1.5h + 1.5h
    assert len(problem.variables) == 2
    total_chunk_dur = sum(v.duration_hours for v in problem.variables)
    assert total_chunk_dur == 3.0


def test_impossible_overconstrained_scenario():
    """Verify that an overconstrained study plan honestly reports INFEASIBLE without crashing."""
    topics = [
        Topic(
            id="imp1",
            name="Massive Syllabus Part 1",
            subject="AI",
            duration_hours=20.0,
            priority=5,
            deadline="2026-10-20T18:00:00"  # Only ~11 hours total from wake to deadline!
        ),
        Topic(
            id="imp2",
            name="Massive Syllabus Part 2",
            subject="AI",
            duration_hours=20.0,
            priority=5,
            deadline="2026-10-20T18:00:00"
        )
    ]
    routine = get_base_routine()
    settings = PlanningSettings(
        start_date="2026-10-20",
        num_days=1,
        slot_duration_minutes=60,
        max_chunk_hours=2.0,
        min_chunk_hours=1.0,
        max_backtracks=500
    )

    problem = create_csp_problem(topics, [], routine, settings)
    solver = CSPSolver(problem)
    success, assignment, stats, events = solver.solve()

    assert success is False
    assert stats.status in ["INFEASIBLE", "SEARCH_LIMIT_REACHED"]
    assert len(assignment) < len(problem.variables)


def test_locked_sessions_preservation():
    """Verify that replanning respects locked study sessions."""
    locked_session = StudySession(
        id="locked_1",
        topic_id="t_locked",
        subject="Mathematics",
        title="Mathematics: Calculus (Part 1/2)",
        start_time="2026-10-20T15:00:00",
        end_time="2026-10-20T17:00:00",
        day_index=1,
        duration_hours=2.0,
        session_type="study",
        is_locked=True
    )

    remaining_topics = [
        Topic(
            id="t_new",
            name="Linear Algebra",
            subject="Mathematics",
            duration_hours=2.0,
            priority=4,
            deadline="2026-10-22T20:00:00"
        )
    ]

    routine = get_base_routine()
    settings = get_base_settings()

    problem = create_csp_problem(
        topics=remaining_topics,
        fixed_commitments=[],
        routine=routine,
        settings=settings,
        locked_sessions=[locked_session]
    )

    solver = CSPSolver(problem)
    success, assignment, stats, events = solver.solve()

    assert success is True
    # Ensure newly scheduled session does not overlap with the locked session [15:00, 17:00]
    locked_start = datetime.fromisoformat("2026-10-20T15:00:00")
    locked_end = datetime.fromisoformat("2026-10-20T17:00:00")

    for slot in assignment.values():
        overlap = (slot.start_dt < locked_end) and (locked_start < slot.end_dt)
        assert not overlap
