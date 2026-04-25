from app.models.user import User
from passlib.context import CryptContext
from app.services.auth_service import create_access_token
from app.models.tag import Tag, NoteTag
from app.models.note import Note

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


def test_tag_tree_includes_note_count(client, test_db):
    headers = get_auth_header(client, test_db)
    tag = client.post("/api/tags", json={"name": "log"}, headers=headers)
    tag_id = tag.json()["id"]

    token_header = {"Authorization": headers["Authorization"]}
    client.post("/api/notes", json={"content": "test #log"}, headers=token_header)
    client.post("/api/notes", json={"content": "another #log"}, headers=token_header)

    response = client.get("/api/tags", headers=headers)
    assert response.status_code == 200
    tree = response.json()
    tag_node = next(t for t in tree if t["name"] == "log")
    assert tag_node["note_count"] == 2


def test_tag_tree_note_count_includes_child_tags(client, test_db):
    headers = get_auth_header(client, test_db)
    token_header = {"Authorization": headers["Authorization"]}

    # Create notes with hierarchical tags - tags are auto-created
    client.post(
        "/api/notes", json={"content": "note for #project"}, headers=token_header
    )
    client.post(
        "/api/notes",
        json={"content": "note for #project/projectA"},
        headers=token_header,
    )
    client.post(
        "/api/notes",
        json={"content": "note for #project/projectA/item1"},
        headers=token_header,
    )

    response = client.get("/api/tags", headers=headers)
    assert response.status_code == 200
    tree = response.json()
    root = next(t for t in tree if t["name"] == "project")
    # Parent count should include all child notes
    assert root["note_count"] == 3
    assert root["children"][0]["note_count"] == 2
    assert root["children"][0]["children"][0]["note_count"] == 1


def test_orphan_tags_cleaned_up_on_note_update(client, test_db):
    headers = get_auth_header(client, test_db)
    token_header = {"Authorization": headers["Authorization"]}

    # Create note with wrong tag
    note = client.post(
        "/api/notes", json={"content": "test #wron"}, headers=token_header
    )
    note_id = note.json()["id"]

    # Verify wrong tag exists
    tags = client.get("/api/tags", headers=headers)
    tag_names = [t["name"] for t in flatten_tree(tags.json())]
    assert "wron" in tag_names

    # Update note with correct tag
    client.put(
        f"/api/notes/{note_id}", json={"content": "test #wrong"}, headers=token_header
    )

    # Verify wrong tag is removed
    tags = client.get("/api/tags", headers=headers)
    tag_names = [t["name"] for t in flatten_tree(tags.json())]
    assert "wron" not in tag_names
    assert "wrong" in tag_names


def test_orphan_tags_cleaned_up_on_note_delete(client, test_db):
    headers = get_auth_header(client, test_db)
    token_header = {"Authorization": headers["Authorization"]}

    # Create note with a tag
    note = client.post(
        "/api/notes", json={"content": "test #temp"}, headers=token_header
    )
    note_id = note.json()["id"]

    # Verify tag exists
    tags = client.get("/api/tags", headers=headers)
    tag_names = [t["name"] for t in flatten_tree(tags.json())]
    assert "temp" in tag_names

    # Delete note
    client.delete(f"/api/notes/{note_id}", headers=token_header)

    # Verify tag is removed
    tags = client.get("/api/tags", headers=headers)
    tag_names = [t["name"] for t in flatten_tree(tags.json())]
    assert "temp" not in tag_names


def flatten_tree(tree):
    result = []
    for node in tree:
        result.append(node)
        if node.get("children"):
            result.extend(flatten_tree(node["children"]))
    return result
