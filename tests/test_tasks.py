from fastapi.testclient import TestClient
from source.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_tasks_create_and_list():
    r = client.post("/tasks", json={"title": "one"})
    assert r.status_code == 201
    body = r.json()
    assert body["id"] == 1
    assert body["title"] == "one"

    r = client.get("/tasks")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    assert items[0]["title"] == "one"
