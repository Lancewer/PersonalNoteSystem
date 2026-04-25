# Docker 生产部署实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 Docker 生产部署配置，实现 Nginx + FastAPI + PostgreSQL 三容器架构

**架构:** 前端静态文件由 Nginx 提供，反向代理 API 请求到 FastAPI 后端，PostgreSQL 作为数据库。所有服务通过 Docker Compose 编排，数据持久化到宿主机目录。

**技术栈:** Docker Compose 3.8, Nginx Alpine, Python 3.11-slim, PostgreSQL 16 Alpine

---

### Task 1: 创建后端 Dockerfile

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: 创建后端 Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: 验证 Dockerfile 语法**

```bash
docker build --no-cache -f backend/Dockerfile ./backend
```

预期：成功构建镜像，输出 "Successfully built <image_id>"

- [ ] **Step 3: 提交**

```bash
git add backend/Dockerfile
git commit -m "feat(docker): add backend Dockerfile with python:3.11-slim"
```

---

### Task 2: 创建 Nginx 配置

**Files:**
- Create: `nginx/nginx.conf`

- [ ] **Step 1: 创建 Nginx 配置文件**

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://backend:8000;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add nginx/nginx.conf
git commit -m "feat(docker): add nginx config with reverse proxy and SPA support"
```

---

### Task 3: 创建 docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - notes-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file:
      - .env.docker
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    volumes:
      - ./data/uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - notes-net

  postgres:
    image: postgres:16-alpine
    env_file:
      - .env.docker
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - notes-net

networks:
  notes-net:
    driver: bridge
```

- [ ] **Step 2: 验证 YAML 语法**

```bash
docker-compose config
```

预期：输出有效的配置，无错误

- [ ] **Step 3: 提交**

```bash
git add docker-compose.yml
git commit -m "feat(docker): add docker-compose.yml with 3-service architecture"
```

---

### Task 4: 创建环境变量模板

**Files:**
- Create: `.env.docker`

- [ ] **Step 1: 创建 .env.docker 模板**

```env
# PostgreSQL
POSTGRES_USER=notes_user
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=notes_db

# Backend
DATABASE_URL=postgresql://notes_user:your-secure-password-here@postgres:5432/notes_db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
UPLOAD_DIR=/app/uploads
CORS_ORIGINS=
```

- [ ] **Step 2: 提交**

```bash
git add .env.docker
git commit -m "feat(docker): add .env.docker template for production deployment"
```

---

### Task 5: 创建 .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: 创建 .dockerignore**

```
node_modules/
dist/
__pycache__/
*.pyc
.env
data/
.git/
.gitignore
*.md
.DS_Store
```

- [ ] **Step 2: 提交**

```bash
git add .dockerignore
git commit -m "feat(docker): add .dockerignore to exclude unnecessary files"
```

---

### Task 6: 更新 .gitignore 添加 Docker 相关规则

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 更新 .gitignore**

在文件末尾添加：

```gitignore
# Docker
data/
.env.local
.env.docker.bak
```

修改后的完整 `.gitignore` 内容：

```gitignore
# Backend
backend/*.db
backend/.env
backend/__pycache__/
backend/**/*.pyc
backend/.pytest_cache/
backend/uploads/

# Frontend
frontend/node_modules
frontend/dist
frontend/.vite/

# OS
.DS_Store

# IDE
.vscode/
.idea/

# Docker
data/
.env.local
.env.docker.bak
```

- [ ] **Step 2: 提交**

```bash
git add .gitignore
git commit -m "chore: add Docker-related entries to .gitignore"
```

---

### Task 7: 创建部署说明文档

**Files:**
- Create: `docs/DOCKER.md`

- [ ] **Step 1: 创建部署说明文档**

```markdown
# Docker 部署指南

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (用于构建前端)

## 首次部署

### 1. 克隆仓库

```bash
git clone git@github.com:Lancewer/PersonalNoteSystem.git
cd PersonalNoteSystem
```

### 2. 配置环境变量

```bash
cp .env.docker .env.local
```

编辑 `.env.local` 文件，修改以下配置：
- `POSTGRES_PASSWORD`: 设置强密码
- `SECRET_KEY`: 设置随机密钥（可使用 `openssl rand -hex 32` 生成）

### 3. 构建前端

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. 启动服务

```bash
docker-compose --env-file .env.local up -d --build
```

### 5. 验证部署

访问 `http://localhost` 或 `http://<NAS-IP>` 查看应用。

查看服务状态：

```bash
docker-compose ps
```

查看日志：

```bash
docker-compose logs -f
```

## 更新部署

```bash
git pull
cd frontend && npm install && npm run build
docker-compose --env-file .env.local up -d --build
```

## 常用命令

### 服务管理

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f [service_name]
```

### 数据库操作

```bash
# 进入数据库
docker-compose exec postgres psql -U notes_user -d notes_db

# 备份数据库
docker-compose exec postgres pg_dump -U notes_user notes_db > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20260425.sql | docker-compose exec -T postgres psql -U notes_user notes_db
```

### 后端调试

```bash
# 进入后端容器
docker-compose exec backend sh

# 查看后端日志
docker-compose logs -f backend
```

## 数据持久化

所有数据存储在 `data/` 目录下：

- `data/postgres/` - PostgreSQL 数据库文件
- `data/uploads/` - 用户上传的附件

建议定期备份 `data/` 目录。

## 故障排查

### 服务启动失败

```bash
# 查看具体服务日志
docker-compose logs backend
docker-compose logs postgres
docker-compose logs nginx
```

### 端口冲突

如果 80 端口被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8080:80"  # 改为 8080 端口
```

### 数据库连接失败

检查 `.env.local` 中的 `POSTGRES_PASSWORD` 是否与 `DATABASE_URL` 中的密码一致。

## 安全建议

1. 使用强密码和随机密钥
2. 定期更新 Docker 镜像
3. 限制 NAS 上 Docker 容器的资源使用
4. 定期备份数据库和上传文件
```

- [ ] **Step 2: 提交**

```bash
git add docs/DOCKER.md
git commit -m "docs: add Docker deployment guide"
```

---

### Task 8: 构建并测试 Docker 部署

**Files:**
- 无新建文件，验证现有配置

- [ ] **Step 1: 确保前端已构建**

```bash
cd frontend && npm run build && cd ..
```

预期：生成 `frontend/dist/` 目录

- [ ] **Step 2: 构建 Docker 镜像**

```bash
docker-compose build
```

预期：成功构建 backend 镜像，拉取 nginx 和 postgres 镜像

- [ ] **Step 3: 启动服务**

```bash
docker-compose --env-file .env.docker up -d
```

预期：三个服务都显示 healthy 状态

- [ ] **Step 4: 验证服务状态**

```bash
docker-compose ps
```

预期：所有服务状态为 "Up" 或 "healthy"

- [ ] **Step 5: 测试前端访问**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost
```

预期：返回 200

- [ ] **Step 6: 测试后端健康检查**

```bash
curl -s http://localhost/api/health
```

预期：返回 `{"status":"ok"}`

- [ ] **Step 7: 停止服务**

```bash
docker-compose down
```

预期：所有容器停止

- [ ] **Step 8: 提交（如有调整）**

```bash
git add -A
git commit -m "test(docker): verify docker-compose deployment works correctly"
```
