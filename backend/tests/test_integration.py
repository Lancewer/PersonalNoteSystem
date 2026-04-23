import os
import shutil
from app.models.user import User
from passlib.context import CryptContext
from app.services.auth_service import create_access_token
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_auth_header(client, test_db):
    user = User(username="testuser", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_full_note_workflow(client, test_db):
    headers = get_auth_header(client, test_db)

    # 创建带标签的笔记
    resp = client.post(
        "/api/notes", json={"content": "今天的想法 #工作/项目A"}, headers=headers
    )
    assert resp.status_code == 201
    note_id = resp.json()["id"]
    assert len(resp.json()["tags"]) == 1

    # 获取时间线
    resp = client.get("/api/notes", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()["notes"]) == 1

    # 获取标签树
    resp = client.get("/api/tags", headers=headers)
    assert resp.status_code == 200
    tree = resp.json()
    assert len(tree) > 0

    # 删除笔记
    resp = client.delete(f"/api/notes/{note_id}", headers=headers)
    assert resp.status_code == 204

    # 验证删除
    resp = client.get("/api/notes", headers=headers)
    assert len(resp.json()["notes"]) == 0
