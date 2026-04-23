from app.models.user import User
from passlib.context import CryptContext
from app.services.auth_service import create_access_token
from app.models.tag import Tag

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_auth_header(client, test_db):
    user = User(username="testuser", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_create_tag_tree(client, test_db):
    headers = get_auth_header(client, test_db)
    parent = client.post("/api/tags", json={"name": "工作"}, headers=headers)
    parent_id = parent.json()["id"]

    child = client.post(
        "/api/tags", json={"name": "项目A", "parent_id": parent_id}, headers=headers
    )
    assert child.status_code == 201
    assert child.json()["name"] == "项目A"


def test_get_tag_tree(client, test_db):
    headers = get_auth_header(client, test_db)
    parent = client.post("/api/tags", json={"name": "根标签"}, headers=headers)
    parent_id = parent.json()["id"]
    client.post(
        "/api/tags", json={"name": "子标签", "parent_id": parent_id}, headers=headers
    )

    response = client.get("/api/tags", headers=headers)
    assert response.status_code == 200
    tree = response.json()
    assert len(tree) > 0
    root = next(t for t in tree if t["name"] == "根标签")
    assert len(root["children"]) == 1
