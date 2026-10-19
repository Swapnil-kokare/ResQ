"""Unit tests for Pydantic models and input validation."""
import pytest
from pydantic import ValidationError
from app.models.schemas import (
    Topic, FixedCommitment, DailyRoutine, MealInterval, PlanningSettings, ScheduleRequest
)


def test_valid_topic():
    topic = Topic(
        id="t1",
        name="Calculus",
        subject="Math",
        duration_hours=3.0,
        priority=5,
        deadline="2026-10-22T22:00:00"
    )
    assert topic.name == "Calculus"
    assert topic.duration_hours == 3.0
    assert topic.priority == 5


def test_invalid_topic_duration():
    with pytest.raises(ValidationError):
        Topic(
            id="t2",
            name="Physics",
            subject="Science",
            duration_hours=-1.0,  # Negative duration not allowed
            priority=3,
            deadline="2026-10-22T22:00:00"
        )


def test_invalid_topic_deadline():
    with pytest.raises(ValidationError):
        Topic(
            id="t3",
            name="Physics",
            subject="Science",
            duration_hours=2.0,
            priority=3,
            deadline="not-a-datetime"  # Invalid ISO datetime
        )


def test_valid_fixed_commitment():
    fc = FixedCommitment(
        id="fc1",
        name="College",
        category="college",
        start_time="2026-10-20T08:00:00",
        end_time="2026-10-20T14:00:00"
    )
    assert fc.name == "College"


def test_invalid_fixed_commitment_inverted_times():
    with pytest.raises(ValidationError):
        FixedCommitment(
            id="fc2",
            name="College",
            category="college",
            start_time="2026-10-20T14:00:00",
            end_time="2026-10-20T08:00:00"  # End before start
        )


def test_meal_interval_validation():
    meal = MealInterval(name="Lunch", start_time="12:30", end_time="13:30")
    assert meal.start_time == "12:30"

    with pytest.raises(ValidationError):
        MealInterval(name="Lunch", start_time="25:00", end_time="13:30")
