from app.models.user import User
from passlib.context import CryptContext
from app.services.auth_service import create_access_token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_auth_header(client, test_db):
    user = User(username="testuser", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_create_note(client, test_db):
    headers = get_auth_header(client, test_db)
    response = client.post(
        "/api/notes", json={"content": "Hello #工作/项目A"}, headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert "Hello" in data["content"]
    assert len(data["tags"]) > 0


def test_list_notes(client, test_db):
    headers = get_auth_header(client, test_db)
    client.post("/api/notes", json={"content": "Note 1"}, headers=headers)
    client.post("/api/notes", json={"content": "Note 2"}, headers=headers)

    response = client.get("/api/notes", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["notes"]) == 2
    assert data["has_more"] == False


def test_delete_note(client, test_db):
    headers = get_auth_header(client, test_db)
    create_resp = client.post(
        "/api/notes", json={"content": "To delete"}, headers=headers
    )
    note_id = create_resp.json()["id"]

    response = client.delete(f"/api/notes/{note_id}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/api/notes/{note_id}", headers=headers)
    assert response.status_code == 404
