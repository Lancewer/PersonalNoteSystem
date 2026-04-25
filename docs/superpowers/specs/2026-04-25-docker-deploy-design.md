# Docker 生产部署设计

## 概述

为个人笔记系统创建 Docker 生产部署方案，使用 Nginx + FastAPI + PostgreSQL 三容器架构，适配本地 NAS Docker 环境。

## 架构

```
用户 → [Nginx:80] → 静态前端文件 (/)
                  → 反向代理 /api/* → [Backend:8000] → [PostgreSQL:5432]
                  → 反向代理 /uploads/* → [Backend:8000]
```

### 服务列表

| 服务 | 基础镜像 | 端口 | 说明 |
|------|----------|------|------|
| nginx | nginx:alpine | 80 → 80 | 前端静态文件 + 反向代理 |
| backend | python:3.11-slim | 8000（仅内部） | FastAPI + uvicorn |
| postgres | postgres:16-alpine | 5432（仅内部） | PostgreSQL 数据库 |

### 网络

- 自定义 bridge 网络 `notes-net`
- 仅 Nginx 暴露 80 端口到宿主机
- 后端和数据库仅在内部网络通信

## 文件结构

```
项目根目录/
├── docker-compose.yml          # 服务编排
├── .env.docker                 # 环境变量模板
├── .dockerignore               # Docker 构建忽略规则
├── backend/
│   └── Dockerfile              # Python 多阶段构建
└── nginx/
    ├── Dockerfile              # Nginx 配置（可选，直接用官方镜像）
    └── nginx.conf              # Nginx 配置
```

## 详细设计

### 1. 前端构建策略

**多阶段构建（backend/Dockerfile 不适用，前端构建在 Nginx 阶段完成）：**

实际上前端构建应该独立处理，有两种方案：

**方案：独立构建阶段**
- 在 docker-compose.yml 中使用构建参数或预先构建
- 推荐使用 CI/CD 或部署脚本预先执行 `npm run build`
- 或者在 nginx 容器中挂载构建好的 dist 目录

**最终选择：预构建 + 挂载/复制**
- 部署前在宿主机执行 `cd frontend && npm run build`
- Nginx 容器挂载 `frontend/dist` 到 `/usr/share/nginx/html`
- 优点：容器轻量，不需要 Node 运行时

### 2. 后端 Dockerfile

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

### 3. Nginx 配置

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

### 4. docker-compose.yml

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

### 5. 环境变量 (.env.docker)

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

### 6. .dockerignore

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

## 数据持久化

| 数据类型 | 宿主机路径 | 容器路径 | 说明 |
|---------|-----------|---------|------|
| PostgreSQL 数据 | `./data/postgres` | `/var/lib/postgresql/data` | 数据库文件 |
| 附件上传 | `./data/uploads` | `/app/uploads` | 用户上传的文件 |
| 前端构建 | `./frontend/dist` | `/usr/share/nginx/html` | 只读挂载 |

## 健康检查

- **PostgreSQL**: `pg_isready` 命令，10 秒间隔
- **Backend**: `curl /health` 端点，30 秒间隔
- **Nginx**: 依赖后端健康状态，不单独检查

## 部署流程

### 首次部署

```bash
# 1. 克隆仓库
git clone <repo-url>
cd PersonalNoteSystem

# 2. 配置环境变量
cp .env.docker .env.local
# 编辑 .env.local 修改密码等配置

# 3. 构建前端
cd frontend && npm install && npm run build && cd ..

# 4. 启动服务
docker-compose --env-file .env.local up -d --build

# 5. 查看日志
docker-compose logs -f
```

### 更新部署

```bash
git pull
cd frontend && npm install && npm run build
docker-compose --env-file .env.local up -d --build
```

### 常用命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 停止服务
docker-compose down

# 停止并删除数据卷（危险！）
docker-compose down -v

# 进入容器
docker-compose exec backend sh
docker-compose exec postgres psql -U notes_user -d notes_db

# 数据库备份
docker-compose exec postgres pg_dump -U notes_user notes_db > backup.sql

# 数据库恢复
cat backup.sql | docker-compose exec -T postgres psql -U notes_user notes_db
```

## 安全性

- `.env.docker` 中的密码应使用强随机密码
- 实际使用的 `.env.local` 应加入 `.gitignore`
- PostgreSQL 端口不暴露到宿主机
- 后端端口不暴露到宿主机，仅通过 Nginx 访问
- 前端 dist 目录以只读方式挂载

## 未来扩展

- **HTTPS**: 添加 Caddy 服务或使用 Nginx + Let's Encrypt
- **开发环境**: 创建 `docker-compose.dev.yml` 覆盖文件，启用热重载
- **监控**: 添加健康检查面板和日志聚合
- **备份**: 定时备份脚本和自动化恢复流程
