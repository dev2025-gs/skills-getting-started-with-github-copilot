from fastapi.testclient import TestClient
from urllib.parse import quote
from src.app import app

client = TestClient(app)


def test_get_activities_contains_samples():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Ensure sample activities (added to server) exist
    assert "Kayaking Trip" in data
    assert "Trail Run" in data


def test_signup_and_unregister_flow():
    activity = "Trail Run"
    email = "jdoe@example.com"

    # get initial count
    resp = client.get("/activities")
    assert resp.status_code == 200
    before = resp.json().get(activity, {}).get("participants_count", 0)

    # signup
    r = client.post(f"/activities/{quote(activity)}/signup", params={"email": email, "name": "John Doe"})
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # ensure count incremented
    after = client.get("/activities").json().get(activity, {}).get("participants_count", 0)
    assert after == before + 1

    # unregister
    r2 = client.post(f"/activities/{quote(activity)}/unregister", params={"email": email})
    assert r2.status_code == 200
    # ensure count back to original
    after2 = client.get("/activities").json().get(activity, {}).get("participants_count", 0)
    assert after2 == before


def test_signup_nonexistent_activity():
    r = client.post("/activities/This%20Doesnt%20Exist/signup", params={"email": "a@b.com"})
    assert r.status_code == 404
