"""Built-in demonstration scenarios for ResQ."""
from datetime import datetime
from typing import List
from app.models.schemas import (
    Topic, FixedCommitment, DailyRoutine, PlanningSettings,
    ScheduleRequest, DemoScenario, MealInterval
)

START_DATE = "2026-10-20"
EXAM_DATETIME = "2026-10-23T09:00:00"


def get_base_routine() -> DailyRoutine:
    return DailyRoutine(
        wake_time="07:00",
        sleep_time="22:30",
        college_days=[1, 2],
        college_start="08:00",
        college_end="14:00",
        meals=[
            MealInterval(name="Lunch", start_time="13:00", end_time="14:00"),
            MealInterval(name="Dinner", start_time="20:00", end_time="21:00"),
        ],
        min_break_minutes=15
    )


def get_base_settings() -> PlanningSettings:
    return PlanningSettings(
        start_date=START_DATE,
        num_days=4,
        slot_duration_minutes=60,
        max_chunk_hours=2.0,
        min_chunk_hours=1.0,
        exam_datetime=EXAM_DATETIME,
        max_backtracks=5000,
        search_timeout_seconds=5.0
    )


def get_feasible_topics() -> List[Topic]:
    return [
        Topic(
            id="t1",
            name="Calculus (Integration & Series)",
            subject="Mathematics",
            duration_hours=3.0,
            priority=5,
            deadline="2026-10-22T22:00:00",
            requires_revision=True,
            color="#3B82F6"
        ),
        Topic(
            id="t2",
            name="Linear Algebra (Eigenvalues & Vectors)",
            subject="Mathematics",
            duration_hours=2.0,
            priority=4,
            deadline="2026-10-22T22:00:00",
            color="#60A5FA"
        ),
        Topic(
            id="t3",
            name="Mechanics (Rotational Motion)",
            subject="Physics",
            duration_hours=2.0,
            priority=4,
            deadline="2026-10-22T22:00:00",
            color="#10B981"
        ),
        Topic(
            id="t4",
            name="Coding & Logic (Trees & Graphs)",
            subject="Computer Science",
            duration_hours=2.0,
            priority=3,
            deadline="2026-10-22T22:00:00",
            color="#8B5CF6"
        ),
        Topic(
            id="t5",
            name="Full Mock Exam Revision",
            subject="Review",
            duration_hours=3.0,
            priority=5,
            deadline="2026-10-23T08:00:00",
            is_revision=True,
            color="#F59E0B"
        ),
        Topic(
            id="t6",
            name="Formula Cheat Sheet Synthesis",
            subject="Review",
            duration_hours=1.5,
            priority=4,
            deadline="2026-10-23T08:00:00",
            is_revision=True,
            color="#EC4899"
        ),
    ]


def get_demo_scenarios() -> List[DemoScenario]:
    """Return the 3 required college project demonstration scenarios."""
    base_routine = get_base_routine()
    base_settings = get_base_settings()

    # Scenario 1: Feasible Plan
    feasible_topics = get_feasible_topics()
    feasible_req = ScheduleRequest(
        topics=feasible_topics,
        fixed_commitments=[],
        routine=base_routine,
        settings=base_settings
    )

    # Scenario 2: Add Urgent Task
    urgent_topics = list(feasible_topics)
    urgent_topics.append(
        Topic(
            id="t_urgent",
            name="URGENT: Operating Systems (Semaphores & Deadlocks)",
            subject="Computer Science",
            duration_hours=2.0,
            priority=5,
            deadline="2026-10-21T21:00:00",  # Urgent deadline on Day 2 evening!
            color="#EF4444"
        )
    )
    urgent_req = ScheduleRequest(
        topics=urgent_topics,
        fixed_commitments=[],
        routine=base_routine,
        settings=base_settings
    )

    # Scenario 3: Impossible / Infeasible Plan
    # Request 36 hours of study before Day 2 deadline where only 12 hours are available!
    impossible_topics = [
        Topic(
            id="imp_1",
            name="Advanced Quantum Mechanics",
            subject="Physics",
            duration_hours=10.0,
            priority=5,
            deadline="2026-10-21T20:00:00",
            color="#EF4444"
        ),
        Topic(
            id="imp_2",
            name="Distributed Systems Architecture",
            subject="Computer Science",
            duration_hours=10.0,
            priority=5,
            deadline="2026-10-21T20:00:00",
            color="#DC2626"
        ),
        Topic(
            id="imp_3",
            name="Real & Functional Analysis",
            subject="Mathematics",
            duration_hours=8.0,
            priority=4,
            deadline="2026-10-21T20:00:00",
            color="#B91C1C"
        ),
        Topic(
            id="imp_4",
            name="Compiler Design & Lexical Analysis",
            subject="Computer Science",
            duration_hours=8.0,
            priority=4,
            deadline="2026-10-21T20:00:00",
            color="#991B1B"
        ),
    ]
    impossible_req = ScheduleRequest(
        topics=impossible_topics,
        fixed_commitments=[],
        routine=base_routine,
        settings=PlanningSettings(
            start_date=START_DATE,
            num_days=2,  # Overconstrained 2-day horizon
            slot_duration_minutes=60,
            max_chunk_hours=2.0,
            min_chunk_hours=1.0,
            exam_datetime="2026-10-21T21:00:00",
            max_backtracks=2000,
            search_timeout_seconds=3.0
        )
    )

    return [
        DemoScenario(
            id="feasible",
            name="1. Feasible Study Plan",
            badge="FEASIBLE",
            description="Default exam schedule with 6 topics (13.5 hours) scheduled cleanly around college and sleep constraints.",
            request=feasible_req
        ),
        DemoScenario(
            id="urgent_task",
            name="2. Add Urgent Task & Replan",
            badge="DYNAMIC REPLAN",
            description="Injects a 2-hour urgent OS topic on Day 2 with high priority, triggering automatic backtracking replan.",
            request=urgent_req
        ),
        DemoScenario(
            id="impossible",
            name="3. Impossible / Overconstrained",
            badge="INFEASIBLE DETECTED",
            description="Requests 36 study hours inside a 2-day horizon with only 12 free hours. System detects bottleneck honestly.",
            request=impossible_req
        )
    ]
