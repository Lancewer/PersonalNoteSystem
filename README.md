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
