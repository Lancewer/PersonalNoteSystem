import pytest
from app.models.user import User
from app.models.note import Note
from passlib.context import CryptContext
from app.services.auth_service import create_access_token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_auth_header(client, test_db):
    user = User(username="searchuser", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_search_notes_by_content(client, test_db):
    """Search should return notes matching the query text."""
    headers = get_auth_header(client, test_db)

    # Create notes with different content
    client.post("/api/notes", json={"content": "Hello world"}, headers=headers)
    client.post("/api/notes", json={"content": "Goodbye world"}, headers=headers)
    client.post("/api/notes", json={"content": "Something else"}, headers=headers)

    # Search for "Hello"
    resp = client.get("/api/notes/search?q=Hello", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["notes"]) == 1
    assert "Hello" in data["notes"][0]["content"]


def test_search_notes_case_insensitive(client, test_db):
    """Search should be case insensitive."""
    headers = get_auth_header(client, test_db)

    client.post("/api/notes", json={"content": "HELLO world"}, headers=headers)
    client.post("/api/notes", json={"content": "Goodbye"}, headers=headers)

    # Search lowercase
    resp = client.get("/api/notes/search?q=hello", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["notes"]) == 1


def test_search_notes_empty_result(client, test_db):
    """Search with no matches should return empty list."""
    headers = get_auth_header(client, test_db)

    client.post("/api/notes", json={"content": "Hello world"}, headers=headers)

    resp = client.get("/api/notes/search?q=nonexistent", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["notes"]) == 0
    assert data["has_more"] is False


def test_search_notes_partial_match(client, test_db):
    """Search should match partial content."""
    headers = get_auth_header(client, test_db)

    client.post(
        "/api/notes", json={"content": "Meeting notes from today"}, headers=headers
    )
    client.post("/api/notes", json={"content": "Todo list"}, headers=headers)

    resp = client.get("/api/notes/search?q=meet", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["notes"]) == 1
    assert "Meeting" in data["notes"][0]["content"]
