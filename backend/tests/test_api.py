"""Integration tests for FastAPI endpoints."""
from fastapi.testclient import TestClient
from app.main import app
from app.api.demo_data import get_demo_scenarios

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "CSP" in data["algorithm"]


def test_demo_scenarios_endpoint():
    response = client.get("/api/demo/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert data[0]["id"] == "feasible"
    assert data[1]["id"] == "urgent_task"
    assert data[2]["id"] == "impossible"


def test_generate_schedule_feasible():
    scenarios = get_demo_scenarios()
    feasible_req = scenarios[0].request.model_dump()

    response = client.post("/api/schedule/generate", json=feasible_req)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "FEASIBLE"
    assert len(data["sessions"]) > 0
    assert len(data["events"]) > 0
    assert data["stats"]["status"] == "FEASIBLE"


def test_generate_schedule_impossible():
    scenarios = get_demo_scenarios()
    impossible_req = scenarios[2].request.model_dump()

    response = client.post("/api/schedule/generate", json=impossible_req)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["status"] in ["INFEASIBLE", "SEARCH_LIMIT_REACHED"]
    assert data["infeasibility_reason"] is not None
    assert len(data["suggestions"]) > 0


def test_validate_schedule_endpoint():
    scenarios = get_demo_scenarios()
    gen_resp = client.post("/api/schedule/generate", json=scenarios[0].request.model_dump())
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()

    validate_payload = {
        "sessions": gen_data["sessions"],
        "topics": [t.model_dump() for t in scenarios[0].request.topics],
        "fixed_commitments": [fc.model_dump() for fc in scenarios[0].request.fixed_commitments],
        "settings": scenarios[0].request.settings.model_dump()
    }
    val_resp = client.post("/api/schedule/validate", json=validate_payload)
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["is_valid"] is True
    assert val_data["hard_constraint_violations"] == 0
