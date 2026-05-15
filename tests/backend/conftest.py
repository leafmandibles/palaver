import pytest
from types import SimpleNamespace

from palaver_backend import main as backend_main


@pytest.fixture(autouse=True)
def fail_unmocked_opencode_client(monkeypatch):
    """Ensure backend tests mock OpenCode upstreams instead of requiring a real server."""

    class UnmockedOpenCodeClient:
        def __init__(self, *args, **kwargs):
            raise AssertionError(
                "Backend tests must replace palaver_backend.main.httpx.AsyncClient "
                "with an in-process OpenCode upstream."
            )

    monkeypatch.setattr(backend_main, "httpx", SimpleNamespace(AsyncClient=UnmockedOpenCodeClient))
