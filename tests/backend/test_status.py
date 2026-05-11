from fastapi.testclient import TestClient

from palaver_backend.main import app


def test_status_returns_ok_response():
    """Test that the public /status health endpoint returns an OK response."""
    client = TestClient(app)

    response = client.get("/status")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
