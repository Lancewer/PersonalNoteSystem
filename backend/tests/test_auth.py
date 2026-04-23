from passlib.context import CryptContext
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def test_login_success(client, test_db):
    user = User(username="testuser", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()

    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/auth/login", json={"username": "wrong", "password": "wrong"}
    )
    assert response.status_code == 401


def test_register_new_user(client, test_db):
    response = client.post(
        "/api/auth/register", json={"username": "newuser", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_register_duplicate_user(client, test_db):
    user = User(username="existing", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()

    response = client.post(
        "/api/auth/register", json={"username": "existing", "password": "password123"}
    )
    assert response.status_code == 400
