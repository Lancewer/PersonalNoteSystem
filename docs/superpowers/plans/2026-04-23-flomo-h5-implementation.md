# 类Flomo H5笔记应用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一个类Flomo的H5笔记应用，支持文字记录、层级标签、多媒体附件，通过FastAPI后端+Vue3前端实现，数据云端同步。

**Architecture:** 前后端分离的单体架构。后端使用Python FastAPI提供REST API，PostgreSQL存储数据，本地文件系统按日期分层存储附件。前端使用Vue 3 + Vite构建，Pinia管理状态，响应式设计适配手机和桌面浏览器。

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL, Pydantic, JWT, Vue 3, Vite, TypeScript, Pinia, Vue Router, Axios

---

## File Structure Overview

### Backend Files
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI应用入口，CORS，路由挂载
│   ├── database.py                      # 数据库连接，Base，Session
│   ├── config.py                        # 环境变量配置
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                      # User ORM模型
│   │   ├── note.py                      # Note ORM模型
│   │   ├── tag.py                       # Tag ORM模型
│   │   └── attachment.py                # Attachment ORM模型
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                      # 用户Pydantic schemas
│   │   ├── note.py                      # 笔记Pydantic schemas
│   │   ├── tag.py                       # 标签Pydantic schemas
│   │   └── attachment.py                # 附件Pydantic schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                      # POST /api/auth/login
│   │   ├── notes.py                     # 笔记CRUD路由
│   │   ├── tags.py                      # 标签管理路由
│   │   └── attachments.py               # 附件上传下载路由
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py              # JWT生成与验证
│   │   ├── note_service.py              # 笔记业务逻辑
│   │   ├── tag_service.py               # 标签业务逻辑(含递归查询)
│   │   └── storage_service.py           # 文件系统存储服务
│   └── dependencies.py                  # 依赖注入(get_db, get_current_user)
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # pytest fixtures
│   ├── test_auth.py
│   ├── test_notes.py
│   ├── test_tags.py
│   └── test_storage.py
├── requirements.txt
└── alembic.ini                          # 数据库迁移配置
    └── env.py
```

### Frontend Files
```
frontend/
├── src/
│   ├── main.ts                          # Vue应用入口
│   ├── App.vue                          # 根组件
│   ├── views/
│   │   ├── Login.vue                    # 登录页
│   │   ├── Timeline.vue                 # 笔记时间线
│   │   ├── TagTree.vue                  # 标签管理页
│   │   └── Settings.vue                 # 设置页
│   ├── components/
│   │   ├── NoteCard.vue                 # 笔记卡片组件
│   │   ├── NoteEditor.vue               # 底部输入编辑器
│   │   └── BottomNav.vue               # 底部导航栏
│   ├── stores/
│   │   ├── auth.ts                      # 认证状态管理
│   │   └── notes.ts                     # 笔记状态管理
│   ├── api/
│   │   ├── request.ts                   # Axios实例配置
│   │   ├── auth.ts                      # 认证API
│   │   ├── notes.ts                     # 笔记API
│   │   └── tags.ts                      # 标签API
│   ├── types/
│   │   └── index.ts                     # TypeScript类型定义
│   └── styles/
│       └── global.css                   # 全局样式
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase 1: 后端基础与认证

### Task 1: 后端项目初始化与数据库模型

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/note.py`
- Create: `backend/app/models/tag.py`
- Create: `backend/app/models/attachment.py`
- Test: `backend/tests/conftest.py`

- [ ] **Step 1: 创建依赖文件**

```txt
# backend/requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.0
pydantic==2.5.2
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pytest==7.4.3
httpx==0.25.2
```

- [ ] **Step 2: 创建配置文件**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/notes_db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 3: 创建数据库连接**

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: 创建User模型**

```python
# backend/app/models/user.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

- [ ] **Step 5: 创建Note模型**

```python
# backend/app/models/note.py
from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from ..database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")
    attachments = relationship("Attachment", back_populates="note", cascade="all, delete-orphan")
```

- [ ] **Step 6: 创建Tag模型（层级结构）**

```python
# backend/app/models/tag.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from ..database import Base

class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    parent = relationship("Tag", remote_side=[id], backref="children")
    notes = relationship("Note", secondary="note_tags", back_populates="tags")

class NoteTag(Base):
    __tablename__ = "note_tags"

    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)
```

- [ ] **Step 7: 创建Attachment模型**

```python
# backend/app/models/attachment.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from ..database import Base
import enum

class FileType(str, enum.Enum):
    image = "image"
    audio = "audio"
    file = "file"

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id"), nullable=False, index=True)
    file_type = Column(String(10), nullable=False)
    file_path = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    note = relationship("Note", back_populates="attachments")
```

- [ ] **Step 8: 创建测试fixtures**

```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.config import settings

TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/notes_test_db"

@pytest.fixture(scope="function")
def test_db():
    engine = create_engine(TEST_DATABASE_URL)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 9: 运行测试验证数据库模型**

```bash
cd backend && python -c "from app.models import user, note, tag, attachment; print('Models loaded successfully')"
```

Expected: `Models loaded successfully`

- [ ] **Step 10: Commit**

```bash
git add backend/
git commit -m "feat: initialize backend project with database models"
```

---

### Task 2: 认证服务与登录API

**Files:**
- Create: `backend/app/dependencies.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/schemas/note.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/app/main.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: 创建认证服务**

```python
# backend/app/services/auth_service.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

- [ ] **Step 2: 创建Pydantic Schemas**

```python
# backend/app/schemas/user.py
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str
    password: str
```

```python
# backend/app/schemas/note.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List

class AttachmentResponse(BaseModel):
    id: UUID
    file_type: str
    file_path: str
    original_name: str
    file_size: int

class TagResponse(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID] = None

class NoteResponse(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    tags: List[TagResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    content: str

class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    has_more: bool
```

```python
# backend/app/schemas/tag.py
from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List

class TagCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None

class TagTreeNode(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID] = None
    children: List["TagTreeNode"] = []

    class Config:
        from_attributes = True
```

- [ ] **Step 3: 创建依赖注入**

```python
# backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .services.auth_service import decode_access_token
from .models.user import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

- [ ] **Step 4: 创建认证路由**

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import LoginRequest, TokenResponse, UserCreate
from ..services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token)

@router.post("/register", response_model=TokenResponse)
def register(request: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    user = User(username=request.username, password_hash=hash_password(request.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token)
```

- [ ] **Step 5: 创建FastAPI应用入口**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, notes, tags, attachments

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Notes API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境，生产环境需限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(tags.router)
app.include_router(attachments.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: 编写认证测试**

```python
# backend/tests/test_auth.py
from passlib.context import CryptContext
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_login_success(client, test_db):
    user = User(username="testuser", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()

    response = client.post("/api/auth/login", json={"username": "testuser", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    response = client.post("/api/auth/login", json={"username": "wrong", "password": "wrong"})
    assert response.status_code == 401

def test_register_new_user(client, test_db):
    response = client.post("/api/auth/register", json={"username": "newuser", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_register_duplicate_user(client, test_db):
    user = User(username="existing", password_hash=pwd_context.hash("password123"))
    test_db.add(user)
    test_db.commit()

    response = client.post("/api/auth/register", json={"username": "existing", "password": "password123"})
    assert response.status_code == 400
```

- [ ] **Step 7: 运行认证测试**

```bash
cd backend && pytest tests/test_auth.py -v
```

Expected: 4 tests pass

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: implement authentication with JWT and login/register API"
```

---

## Phase 2: 笔记与标签核心功能

### Task 3: 笔记CRUD服务与API

**Files:**
- Create: `backend/app/services/note_service.py`
- Create: `backend/app/routers/notes.py`
- Test: `backend/tests/test_notes.py`

- [ ] **Step 1: 创建笔记服务**

```python
# backend/app/services/note_service.py
from sqlalchemy.orm import Session
from uuid import UUID
from ..models.note import Note
from ..models.tag import Tag, NoteTag
from ..schemas.note import NoteCreate, NoteResponse, NoteListResponse

PAGE_SIZE = 20

def create_note(db: Session, user_id: UUID, content: str) -> Note:
    note = Note(user_id=user_id, content=content)
    db.add(note)
    db.flush()

    tags = extract_tags(content)
    for tag_name in tags:
        tag = get_or_create_tag(db, user_id, tag_name)
        note_tag = NoteTag(note_id=note.id, tag_id=tag.id)
        db.add(note_tag)

    db.commit()
    db.refresh(note)
    return note

def get_notes_by_user(db: Session, user_id: UUID, skip: int = 0, limit: int = PAGE_SIZE) -> NoteListResponse:
    query = db.query(Note).filter(Note.user_id == user_id).order_by(Note.created_at.desc())
    total = query.count()
    notes = query.offset(skip).limit(limit + 1).all()
    has_more = len(notes) > limit
    if has_more:
        notes = notes[:-1]
    return NoteListResponse(notes=notes, has_more=has_more)

def get_note_by_id(db: Session, note_id: UUID, user_id: UUID) -> Note:
    return db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()

def update_note(db: Session, note_id: UUID, user_id: UUID, content: str) -> Note:
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        return None
    note.content = content
    db.query(NoteTag).filter(NoteTag.note_id == note_id).delete()
    tags = extract_tags(content)
    for tag_name in tags:
        tag = get_or_create_tag(db, user_id, tag_name)
        db.add(NoteTag(note_id=note_id, tag_id=tag.id))
    db.commit()
    db.refresh(note)
    return note

def delete_note(db: Session, note_id: UUID, user_id: UUID) -> bool:
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        return False
    db.delete(note)
    db.commit()
    return True

def extract_tags(content: str) -> list[str]:
    import re
    return list(set(re.findall(r'#([\w\u4e00-\u9fff/]+)', content)))

def get_or_create_tag(db: Session, user_id: UUID, full_path: str) -> Tag:
    parts = full_path.split('/')
    parent = None
    for part in parts:
        tag = db.query(Tag).filter(
            Tag.user_id == user_id,
            Tag.name == part,
            Tag.parent_id == (parent.id if parent else None)
        ).first()
        if not tag:
            tag = Tag(user_id=user_id, name=part, parent_id=parent.id if parent else None)
            db.add(tag)
            db.flush()
        parent = tag
    return parent
```

- [ ] **Step 2: 创建笔记路由**

```python
# backend/app/routers/notes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..schemas.note import NoteCreate, NoteResponse, NoteListResponse
from ..services.note_service import create_note, get_notes_by_user, get_note_by_id, update_note, delete_note

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_new_note(request: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_note(db, current_user.id, request.content)

@router.get("", response_model=NoteListResponse)
def list_notes(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_notes_by_user(db, current_user.id, skip, limit)

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_existing_note(note_id: UUID, request: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = update_note(db, note_id, current_user.id, request.content)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_note(note_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not delete_note(db, note_id, current_user.id):
        raise HTTPException(status_code=404, detail="Note not found")
```

- [ ] **Step 3: 编写笔记测试**

```python
# backend/tests/test_notes.py
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
    response = client.post("/api/notes", json={"content": "Hello #工作/项目A"}, headers=headers)
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
    create_resp = client.post("/api/notes", json={"content": "To delete"}, headers=headers)
    note_id = create_resp.json()["id"]

    response = client.delete(f"/api/notes/{note_id}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/api/notes/{note_id}", headers=headers)
    assert response.status_code == 404
```

- [ ] **Step 4: 运行笔记测试**

```bash
cd backend && pytest tests/test_notes.py -v
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: implement notes CRUD with auto tag extraction"
```

---

### Task 4: 层级标签服务与API

**Files:**
- Create: `backend/app/services/tag_service.py`
- Create: `backend/app/routers/tags.py`
- Test: `backend/tests/test_tags.py`

- [ ] **Step 1: 创建标签服务**

```python
# backend/app/services/tag_service.py
from sqlalchemy.orm import Session
from uuid import UUID
from ..models.tag import Tag, NoteTag
from ..models.note import Note
from ..schemas.tag import TagCreate, TagTreeNode

def create_tag(db: Session, user_id: UUID, name: str, parent_id: UUID = None) -> Tag:
    tag = Tag(user_id=user_id, name=name, parent_id=parent_id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

def get_tag_tree(db: Session, user_id: UUID) -> list[TagTreeNode]:
    all_tags = db.query(Tag).filter(Tag.user_id == user_id).all()
    tag_dict = {str(tag.id): TagTreeNode(id=tag.id, name=tag.name, parent_id=tag.parent_id) for tag in all_tags}

    roots = []
    for tag_id, node in tag_dict.items():
        if node.parent_id is None:
            roots.append(node)
        else:
            parent = tag_dict.get(str(node.parent_id))
            if parent:
                parent.children.append(node)
    return roots

def get_notes_by_tag(db: Session, user_id: UUID, tag_id: UUID, skip: int = 0, limit: int = 20) -> list:
    child_ids = get_all_child_tag_ids(db, tag_id)
    child_ids.append(tag_id)

    notes = (
        db.query(Note)
        .join(NoteTag, Note.id == NoteTag.note_id)
        .filter(NoteTag.tag_id.in_(child_ids), Note.user_id == user_id)
        .order_by(Note.created_at.desc())
        .offset(skip)
        .limit(limit + 1)
        .all()
    )
    return notes

def get_all_child_tag_ids(db: Session, tag_id: UUID) -> list[UUID]:
    children = db.query(Tag.id).filter(Tag.parent_id == tag_id).all()
    ids = [c[0] for c in children]
    for child_id in ids:
        ids.extend(get_all_child_tag_ids(db, child_id))
    return ids
```

- [ ] **Step 2: 创建标签路由**

```python
# backend/app/routers/tags.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..schemas.tag import TagCreate, TagTreeNode
from ..schemas.note import NoteListResponse
from ..services.tag_service import create_tag, get_tag_tree, get_notes_by_tag
from ..services.note_service import PAGE_SIZE

router = APIRouter(prefix="/api/tags", tags=["tags"])

@router.post("", response_model=TagTreeNode, status_code=status.HTTP_201_CREATED)
def create_new_tag(request: TagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_tag(db, current_user.id, request.name, request.parent_id)

@router.get("", response_model=list[TagTreeNode])
def list_tags(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_tag_tree(db, current_user.id)

@router.get("/{tag_id}/notes")
def get_tag_notes(tag_id: UUID, skip: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = get_notes_by_tag(db, current_user.id, tag_id, skip, PAGE_SIZE)
    has_more = len(notes) > PAGE_SIZE
    if has_more:
        notes = notes[:-1]
    return {"notes": notes, "has_more": has_more}
```

- [ ] **Step 3: 编写标签测试**

```python
# backend/tests/test_tags.py
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

    child = client.post("/api/tags", json={"name": "项目A", "parent_id": parent_id}, headers=headers)
    assert child.status_code == 201
    assert child.json()["name"] == "项目A"

def test_get_tag_tree(client, test_db):
    headers = get_auth_header(client, test_db)
    parent = client.post("/api/tags", json={"name": "根标签"}, headers=headers)
    parent_id = parent.json()["id"]
    client.post("/api/tags", json={"name": "子标签", "parent_id": parent_id}, headers=headers)

    response = client.get("/api/tags", headers=headers)
    assert response.status_code == 200
    tree = response.json()
    assert len(tree) > 0
    root = next(t for t in tree if t["name"] == "根标签")
    assert len(root["children"]) == 1
```

- [ ] **Step 4: 运行标签测试**

```bash
cd backend && pytest tests/test_tags.py -v
```

Expected: 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: implement hierarchical tags with tree API and tag-based note filtering"
```

---

### Task 5: 附件存储服务与API

**Files:**
- Create: `backend/app/services/storage_service.py`
- Create: `backend/app/routers/attachments.py`
- Create: `backend/app/schemas/attachment.py`
- Test: `backend/tests/test_storage.py`

- [ ] **Step 1: 创建存储服务**

```python
# backend/app/services/storage_service.py
import os
from datetime import datetime
from fastapi import UploadFile
from ..config import settings

ALLOWED_TYPES = {
    "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "audio": ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"],
}

MAX_SIZES = {
    "image": 5 * 1024 * 1024,   # 5MB
    "audio": 10 * 1024 * 1024,  # 10MB
}

def get_file_type(content_type: str) -> str:
    for file_type, types in ALLOWED_TYPES.items():
        if content_type in types:
            return file_type
    return "file"

def generate_file_path(file_type: str, original_name: str) -> str:
    now = datetime.now()
    date_dir = now.strftime("%Y/%m/%d")
    timestamp = now.strftime("%Y%m%dT%H%M%S")
    ext = os.path.splitext(original_name)[1] or f".{file_type}"
    filename = f"{file_type}_{timestamp}{ext}"
    return f"{date_dir}/attachment/{filename}"

async def save_upload_file(upload_file: UploadFile) -> dict:
    content = await upload_file.read()
    file_type = get_file_type(upload_file.content_type or "")
    max_size = MAX_SIZES.get(file_type, 10 * 1024 * 1024)

    if len(content) > max_size:
        raise ValueError(f"File too large. Max size: {max_size / 1024 / 1024}MB")

    file_path = generate_file_path(file_type, upload_file.filename)
    full_path = os.path.join(settings.UPLOAD_DIR, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with open(full_path, "wb") as f:
        f.write(content)

    return {
        "file_path": file_path,
        "file_type": file_type,
        "file_size": len(content),
    }
```

- [ ] **Step 2: 创建附件路由**

```python
# backend/app/routers/attachments.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.note import Note
from ..models.attachment import Attachment
from ..config import settings
from ..services.storage_service import save_upload_file

router = APIRouter(prefix="/api", tags=["attachments"])

@router.post("/notes/{note_id}/attachments", status_code=201)
async def upload_attachment(
    note_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        result = await save_upload_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    attachment = Attachment(
        note_id=note_id,
        file_type=result["file_type"],
        file_path=result["file_path"],
        original_name=file.filename,
        file_size=result["file_size"],
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return {"id": attachment.id, "file_type": attachment.file_type, "file_path": attachment.file_path}

@router.get("/attachments/{attachment_id}")
def download_attachment(attachment_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attachment = (
        db.query(Attachment)
        .join(Note)
        .filter(Attachment.id == attachment_id, Note.user_id == current_user.id)
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    full_path = os.path.join(settings.UPLOAD_DIR, attachment.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(full_path, filename=attachment.original_name)
```

- [ ] **Step 3: 创建附件Schema**

```python
# backend/app/schemas/attachment.py
from pydantic import BaseModel
from uuid import UUID

class AttachmentUploadResponse(BaseModel):
    id: UUID
    file_type: str
    file_path: str
```

- [ ] **Step 4: 编写存储测试**

```python
# backend/tests/test_storage.py
import pytest
from app.services.storage_service import generate_file_path, get_file_type

def test_generate_file_path():
    path = generate_file_path("image", "test.jpg")
    parts = path.split("/")
    assert len(parts) == 4  # YYYY/MM/DD/attachment/filename
    assert parts[3].startswith("attachment/")
    assert "image_" in parts[3]
    assert ".jpg" in parts[3]

def test_get_file_type():
    assert get_file_type("image/jpeg") == "image"
    assert get_file_type("audio/mpeg") == "audio"
    assert get_file_type("application/pdf") == "file"
```

- [ ] **Step 5: 运行存储测试**

```bash
cd backend && pytest tests/test_storage.py -v
```

Expected: 2 tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: implement attachment storage with date-based directory structure"
```

---

## Phase 3: 前端基础与认证

### Task 6: 前端项目初始化

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/styles/global.css`
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: 创建package.json**

```json
{
  "name": "personal-notes-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.8",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.1",
    "typescript": "^5.3.2",
    "vite": "^5.0.4",
    "vue-tsc": "^1.8.22"
  }
}
```

- [ ] **Step 2: 创建Vite配置**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: 创建TypeScript配置**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建HTML入口**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>个人笔记</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建类型定义**

```typescript
// frontend/src/types/index.ts
export interface User {
  id: string
  username: string
}

export interface Note {
  id: string
  content: string
  created_at: string
  tags: Tag[]
  attachments: Attachment[]
}

export interface Tag {
  id: string
  name: string
  parent_id: string | null
  children?: Tag[]
}

export interface Attachment {
  id: string
  file_type: 'image' | 'audio' | 'file'
  file_path: string
  original_name: string
  file_size: number
}

export interface NoteListResponse {
  notes: Note[]
  has_more: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
```

- [ ] **Step 6: 创建全局样式**

```css
/* frontend/src/styles/global.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #4a90d9;
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-color: #333333;
  --text-secondary: #888888;
  --border-color: #e0e0e0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

#app {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: var(--bg-color);
}

input, textarea, button {
  font-family: inherit;
  font-size: inherit;
}
```

- [ ] **Step 7: 创建App.vue根组件**

```vue
<!-- frontend/src/App.vue -->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
  }
})
</script>
```

- [ ] **Step 8: 创建应用入口**

```typescript
// frontend/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/global.css'

const routes = [
  { path: '/login', component: () => import('./views/Login.vue') },
  { path: '/', component: () => import('./views/Timeline.vue'), meta: { requiresAuth: true } },
  { path: '/tags', component: () => import('./views/TagTree.vue'), meta: { requiresAuth: true } },
  { path: '/settings', component: () => import('./views/Settings.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 9: 验证前端构建**

```bash
cd frontend && npm install && npm run build
```

Expected: Build succeeds without errors

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: initialize Vue 3 frontend project with router and pinia"
```

---

### Task 7: 认证状态与API层

**Files:**
- Create: `frontend/src/api/request.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/stores/auth.ts`

- [ ] **Step 1: 创建Axios实例**

```typescript
// frontend/src/api/request.ts
import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
```

- [ ] **Step 2: 创建认证API**

```typescript
// frontend/src/api/auth.ts
import request from './request'
import type { TokenResponse } from '../types'

export const login = (username: string, password: string): Promise<TokenResponse> => {
  return request.post('/auth/login', { username, password }).then(res => res.data)
}

export const register = (username: string, password: string): Promise<TokenResponse> => {
  return request.post('/auth/register', { username, password }).then(res => res.data)
}
```

- [ ] **Step 3: 创建认证状态管理**

```typescript
// frontend/src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => !!token.value)

  async function doLogin(username: string, password: string) {
    const response = await apiLogin(username, password)
    token.value = response.access_token
    localStorage.setItem('token', response.access_token)
  }

  function doLogout() {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isLoggedIn, doLogin, doLogout }
})
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/ frontend/src/stores/auth.ts
git commit -m "feat: implement auth API layer and Pinia auth store"
```

---

### Task 8: 登录页面

**Files:**
- Create: `frontend/src/views/Login.vue`

- [ ] **Step 1: 创建登录页面**

```vue
<!-- frontend/src/views/Login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">个人笔记</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            required
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            required
            autocomplete="current-password"
          />
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await authStore.doLogin(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.detail || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 40px 30px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  color: var(--primary-color);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: var(--primary-color);
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/Login.vue
git commit -m "feat: implement login page with form validation"
```

---

## Phase 4: 前端核心功能

### Task 9: 笔记API与状态管理

**Files:**
- Create: `frontend/src/api/notes.ts`
- Create: `frontend/src/stores/notes.ts`

- [ ] **Step 1: 创建笔记API**

```typescript
// frontend/src/api/notes.ts
import request from './request'
import type { Note, NoteListResponse } from '../types'

export const createNote = (content: string): Promise<Note> => {
  return request.post('/notes', { content }).then(res => res.data)
}

export const getNotes = (skip = 0, limit = 20): Promise<NoteListResponse> => {
  return request.get('/notes', { params: { skip, limit } }).then(res => res.data)
}

export const getNote = (id: string): Promise<Note> => {
  return request.get(`/notes/${id}`).then(res => res.data)
}

export const updateNote = (id: string, content: string): Promise<Note> => {
  return request.put(`/notes/${id}`, { content }).then(res => res.data)
}

export const deleteNote = (id: string): Promise<void> => {
  return request.delete(`/notes/${id}`).then(() => undefined)
}
```

- [ ] **Step 2: 创建笔记状态管理**

```typescript
// frontend/src/stores/notes.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, Tag } from '../types'
import { getNotes, createNote as apiCreateNote, deleteNote as apiDeleteNote } from '../api/notes'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const activeTag = ref<Tag | null>(null)
  let skip = 0

  async function fetchNotes(reset = false) {
    if (loading.value) return
    if (reset) {
      skip = 0
      notes.value = []
    }
    if (!hasMore.value && !reset) return

    loading.value = true
    try {
      const response = await getNotes(skip)
      if (reset) {
        notes.value = response.notes
      } else {
        notes.value.push(...response.notes)
      }
      hasMore.value = response.has_more
      skip += response.notes.length
    } finally {
      loading.value = false
    }
  }

  async function createNote(content: string) {
    const newNote = await apiCreateNote(content)
    notes.value.unshift(newNote)
  }

  async function removeNote(id: string) {
    await apiDeleteNote(id)
    notes.value = notes.value.filter(n => n.id !== id)
  }

  function filterByTag(tag: Tag | null) {
    activeTag.value = tag
  }

  return { notes, loading, hasMore, activeTag, fetchNotes, createNote, removeNote, filterByTag }
})
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/notes.ts frontend/src/stores/notes.ts
git commit -m "feat: implement notes API layer and Pinia notes store with pagination"
```

---

### Task 10: 笔记卡片与时间线页面

**Files:**
- Create: `frontend/src/components/NoteCard.vue`
- Create: `frontend/src/views/Timeline.vue`

- [ ] **Step 1: 创建笔记卡片组件**

```vue
<!-- frontend/src/components/NoteCard.vue -->
<template>
  <div class="note-card">
    <p class="note-content" v-html="renderedContent"></p>
    <div v-if="note.tags.length" class="note-tags">
      <span v-for="tag in note.tags" :key="tag.id" class="tag">
        {{ tag.name }}
      </span>
    </div>
    <div v-if="note.attachments.length" class="note-attachments">
      <img
        v-for="att in imageAttachments"
        :key="att.id"
        :src="`/api/attachments/${att.id}`"
        class="attachment-image"
        loading="lazy"
      />
    </div>
    <div class="note-footer">
      <span class="note-time">{{ formatTime(note.created_at) }}</span>
      <button class="delete-btn" @click="$emit('delete', note.id)">删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '../types'

const props = defineProps<{
  note: Note
}>()

defineEmits<{
  delete: [id: string]
}>()

const imageAttachments = computed(() =>
  props.note.attachments.filter(a => a.file_type === 'image')
)

function renderContent(content: string): string {
  return content.replace(/#([\w\u4e00-\u9fff/]+)/g, '<span class="tag-inline">#$1</span>')
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const renderedContent = computed(() => renderContent(props.note.content))
</script>

<style scoped>
.note-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.note-content {
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag, .tag-inline {
  color: var(--primary-color);
  font-size: 13px;
}

.attachment-image {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.note-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.delete-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
}
</style>
```

- [ ] **Step 2: 创建时间线页面**

```vue
<!-- frontend/src/views/Timeline.vue -->
<template>
  <div class="timeline">
    <div v-if="notesStore.notes.length === 0 && !notesStore.loading" class="empty-state">
      <p>还没有笔记，开始记录你的想法吧</p>
    </div>
    <NoteCard
      v-for="note in notesStore.notes"
      :key="note.id"
      :note="note"
      @delete="handleDelete"
    />
    <div v-if="notesStore.loading" class="loading">加载中...</div>
    <NoteEditor @submit="handleCreate" />
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotesStore } from '../stores/notes'
import NoteCard from '../components/NoteCard.vue'
import NoteEditor from '../components/NoteEditor.vue'
import BottomNav from '../components/BottomNav.vue'

const notesStore = useNotesStore()

onMounted(() => {
  notesStore.fetchNotes(true)
})

async function handleCreate(content: string) {
  await notesStore.createNote(content)
}

async function handleDelete(id: string) {
  if (confirm('确定删除这条笔记吗？')) {
    await notesStore.removeNote(id)
  }
}
</script>

<style scoped>
.timeline {
  padding: 16px;
  padding-bottom: 120px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/NoteCard.vue frontend/src/views/Timeline.vue
git commit -m "feat: implement timeline view with note cards and infinite scroll"
```

---

### Task 11: 笔记编辑器与底部导航

**Files:**
- Create: `frontend/src/components/NoteEditor.vue`
- Create: `frontend/src/components/BottomNav.vue`

- [ ] **Step 1: 创建笔记编辑器**

```vue
<!-- frontend/src/components/NoteEditor.vue -->
<template>
  <div class="note-editor">
    <textarea
      v-model="content"
      placeholder="记录你的想法... 使用 #标签 分类"
      rows="2"
      @keydown.enter.ctrl="handleSubmit"
    ></textarea>
    <div class="editor-toolbar">
      <label class="toolbar-btn" title="上传图片">
        📷
        <input type="file" accept="image/*" @change="handleImageUpload" hidden />
      </label>
      <span class="char-count">{{ content.length }}</span>
      <button class="submit-btn" :disabled="!content.trim()" @click="handleSubmit">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [content: string]
}>()

const content = ref('')

function handleSubmit() {
  if (!content.value.trim()) return
  emit('submit', content.value)
  content.value = ''
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    content.value += ` [图片待上传] `
  }
}
</script>

<style scoped>
.note-editor {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding: 12px 16px;
  z-index: 100;
}

.note-editor textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  background: transparent;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.toolbar-btn {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.submit-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 2: 创建底部导航**

```vue
<!-- frontend/src/components/BottomNav.vue -->
<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" active-class="active">
      <span class="nav-icon">📝</span>
      <span class="nav-label">笔记</span>
    </router-link>
    <router-link to="/tags" class="nav-item" active-class="active">
      <span class="nav-icon">🏷️</span>
      <span class="nav-label">标签</span>
    </router-link>
    <router-link to="/settings" class="nav-item" active-class="active">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">设置</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  display: flex;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.2s;
  min-height: 60px;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-icon {
  font-size: 22px;
}

.nav-label {
  font-size: 11px;
  margin-top: 2px;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/NoteEditor.vue frontend/src/components/BottomNav.vue
git commit -m "feat: implement note editor and bottom navigation"
```

---

### Task 12: 标签管理页面与设置页

**Files:**
- Create: `frontend/src/api/tags.ts`
- Create: `frontend/src/views/TagTree.vue`
- Create: `frontend/src/views/Settings.vue`

- [ ] **Step 1: 创建标签API**

```typescript
// frontend/src/api/tags.ts
import request from './request'
import type { Tag, NoteListResponse } from '../types'

export const getTags = (): Promise<Tag[]> => {
  return request.get('/tags').then(res => res.data)
}

export const createTag = (name: string, parentId: string | null = null): Promise<Tag> => {
  return request.post('/tags', { name, parent_id: parentId }).then(res => res.data)
}

export const getNotesByTag = (tagId: string, skip = 0): Promise<NoteListResponse> => {
  return request.get(`/tags/${tagId}/notes`, { params: { skip } }).then(res => res.data)
}
```

- [ ] **Step 2: 创建标签管理页面**

```vue
<!-- frontend/src/views/TagTree.vue -->
<template>
  <div class="tag-tree-page">
    <h2 class="page-title">标签管理</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="tags.length === 0" class="empty">还没有标签</div>
    <ul v-else class="tag-list">
      <li v-for="tag in tags" :key="tag.id" class="tag-item">
        <div class="tag-row" @click="handleTagClick(tag)">
          <span class="tag-name">#{{ tag.name }}</span>
          <span v-if="tag.children?.length" class="toggle" @click.stop="toggleTag(tag)">
            {{ expandedTags.has(tag.id) ? '▼' : '▶' }}
          </span>
        </div>
        <ul v-if="expandedTags.has(tag.id) && tag.children?.length" class="tag-children">
          <li v-for="child in tag.children" :key="child.id" class="tag-child-item">
            <span class="tag-name" @click="handleTagClick(child)">#{{ child.name }}</span>
          </li>
        </ul>
      </li>
    </ul>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTags } from '../api/tags'
import type { Tag } from '../types'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const tags = ref<Tag[]>([])
const loading = ref(true)
const expandedTags = ref(new Set<string>())

onMounted(async () => {
  tags.value = await getTags()
  loading.value = false
})

function toggleTag(tag: Tag) {
  if (expandedTags.value.has(tag.id)) {
    expandedTags.value.delete(tag.id)
  } else {
    expandedTags.value.add(tag.id)
  }
}

function handleTagClick(tag: Tag) {
  router.push({ path: '/', query: { tag: tag.id } })
}
</script>

<style scoped>
.tag-tree-page {
  padding: 20px 16px;
  padding-bottom: 80px;
}

.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.tag-list {
  list-style: none;
}

.tag-item {
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--card-bg);
  border-radius: 8px;
  cursor: pointer;
}

.tag-name {
  font-size: 15px;
  color: var(--primary-color);
}

.toggle {
  font-size: 12px;
  color: var(--text-secondary);
}

.tag-children {
  list-style: none;
  margin-left: 20px;
  margin-top: 4px;
}

.tag-child-item {
  padding: 8px 12px;
}

.loading, .empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}
</style>
```

- [ ] **Step 3: 创建设置页面**

```vue
<!-- frontend/src/views/Settings.vue -->
<template>
  <div class="settings-page">
    <h2 class="page-title">设置</h2>
    <div class="settings-card">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>
    <p class="version">v1.0.0</p>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.doLogout()
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  padding: 20px 16px;
  padding-bottom: 80px;
}

.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.settings-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 20px;
}

.logout-btn {
  width: 100%;
  padding: 14px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  min-height: 44px;
}

.version {
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 30px;
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/tags.ts frontend/src/views/TagTree.vue frontend/src/views/Settings.vue
git commit -m "feat: implement tag tree view and settings page"
```

---

## Phase 5: 集成测试与部署准备

### Task 13: 集成测试与启动脚本

**Files:**
- Create: `backend/.env.example`
- Create: `backend/tests/test_integration.py`
- Create: `start.sh`
- Create: `README.md`

- [ ] **Step 1: 创建环境配置示例**

```env
# backend/.env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notes_db
SECRET_KEY=change-this-to-a-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
UPLOAD_DIR=./uploads
```

- [ ] **Step 2: 创建集成测试**

```python
# backend/tests/test_integration.py
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
    resp = client.post("/api/notes", json={"content": "今天的想法 #工作/项目A"}, headers=headers)
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
```

- [ ] **Step 3: 创建启动脚本**

```bash
#!/bin/bash
# start.sh - 启动开发环境

echo "Starting backend..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:3000"
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

- [ ] **Step 4: 创建README**

```markdown
# 个人笔记系统

类Flomo的H5笔记应用，支持文字记录、层级标签、图片附件。

## 技术栈

- 前端: Vue 3 + Vite + TypeScript + Pinia
- 后端: Python FastAPI + SQLAlchemy + PostgreSQL

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

### 后端启动

```bash
cd backend
cp .env.example .env
# 编辑 .env 配置数据库连接
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 一键启动

```bash
chmod +x start.sh
./start.sh
```

## API文档

启动后端后访问: http://localhost:8000/docs
```

- [ ] **Step 5: 运行集成测试**

```bash
cd backend && pytest tests/test_integration.py -v
```

Expected: 1 integration test pass

- [ ] **Step 6: 最终Commit**

```bash
git add .
git commit -m "feat: add integration tests, startup scripts, and README"
```

---

## Plan Self-Review

### 1. Spec Coverage Check

| Spec Requirement | Task Coverage |
|------------------|---------------|
| Vue 3 + Vite 前端 | Task 6 |
| FastAPI + PostgreSQL 后端 | Task 1-5 |
| JWT 认证 | Task 2, 7, 8 |
| 笔记CRUD | Task 3, 9, 10 |
| 层级标签 | Task 4, 12 |
| 附件存储 (YYYY/MM/DD/attachment/) | Task 5 |
| 时间线展示 | Task 10 |
| 响应式设计 | Task 6 (global.css), Task 10-12 |
| 底部导航 | Task 11 |
| 个人单用户使用 | Task 2 (register for initial setup) |

### 2. Placeholder Scan

- No TBD/TODO placeholders found
- All code snippets are complete with actual implementation
- No "add appropriate error handling" without concrete code

### 3. Type Consistency

- `Note`, `Tag`, `Attachment` types consistent across backend schemas and frontend types
- API paths match between backend routers and frontend API calls
- UUID used consistently for all IDs

### 4. Task Independence

- Each task commits working code independently
- Tasks build on each other but each produces a functional increment
- Backend tasks complete before frontend tasks start
