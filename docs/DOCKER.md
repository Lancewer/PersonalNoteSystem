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
