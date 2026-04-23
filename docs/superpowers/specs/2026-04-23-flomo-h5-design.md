# 类Flomo H5笔记应用 - 设计文档

> 日期: 2026-04-23
> 状态: 待审批

## 1. 项目概述

开发一个类Flomo的H5笔记应用，支持手机浏览器和桌面网页浏览器使用。核心功能：快速记录文字笔记，支持层级标签、图片附件、语音录制，数据云端同步。

**目标用户**：个人使用 (单用户MVP)

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router |
| 后端 | Python FastAPI + SQLAlchemy |
| 数据库 | PostgreSQL |
| 认证 | JWT (JSON Web Token) |
| 文件存储 | 本地磁盘 (MVP) / 后续可替换为OSS |

## 3. 系统架构

单体架构，前后端分离：

```
前端 (Vue 3 + Vite)  ←→  后端 (FastAPI + PostgreSQL)
```

### 3.1 目录结构

```
personalNoteSystem/
├── frontend/                    # Vue 3 前端
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   │   ├── Login.vue        # 登录页
│   │   │   ├── Timeline.vue     # 笔记时间线
│   │   │   ├── TagTree.vue      # 标签管理
│   │   │   └── Settings.vue     # 设置页
│   │   ├── components/          # 可复用组件
│   │   │   ├── NoteCard.vue     # 笔记卡片
│   │   │   ├── NoteEditor.vue   # 底部输入编辑器
│   │   │   └── BottomNav.vue    # 底部导航栏
│   │   ├── stores/              # Pinia 状态管理
│   │   │   ├── auth.ts          # 认证状态
│   │   │   └── notes.ts         # 笔记状态
│   │   ├── api/                 # API 请求封装
│   │   │   ├── request.ts       # Axios 实例
│   │   │   ├── auth.ts          # 认证接口
│   │   │   ├── notes.ts         # 笔记接口
│   │   │   └── tags.ts          # 标签接口
│   │   ├── styles/              # 全局样式
│   │   └── App.vue
│   └── package.json
│
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── main.py              # 应用入口
│   │   ├── routers/             # API 路由
│   │   │   ├── auth.py          # 认证路由
│   │   │   ├── notes.py         # 笔记路由
│   │   │   ├── tags.py          # 标签路由
│   │   │   └── attachments.py   # 附件路由
│   │   ├── models/              # 数据库模型 (SQLAlchemy)
│   │   │   ├── user.py
│   │   │   ├── note.py
│   │   │   ├── tag.py
│   │   │   └── attachment.py
│   │   ├── schemas/             # Pydantic 数据模型
│   │   │   ├── user.py
│   │   │   ├── note.py
│   │   │   └── tag.py
│   │   ├── services/            # 业务逻辑
│   │   │   ├── auth_service.py
│   │   │   ├── note_service.py
│   │   │   └── tag_service.py
│   │   └── database.py          # 数据库连接
│   └── requirements.txt
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-23-flomo-h5-design.md
```

## 4. 数据模型

### 4.1 User (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| password_hash | VARCHAR(255) | bcrypt加密密码 |
| created_at | TIMESTAMP | 创建时间 |

### 4.2 Note (笔记表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| user_id | UUID (FK → User) | 所属用户 |
| content | TEXT | 笔记正文 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 4.3 Tag (标签表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| user_id | UUID (FK → User) | 所属用户 |
| name | VARCHAR(50) | 标签名称 |
| parent_id | UUID (FK → Tag, NULL) | 父标签ID |
| created_at | TIMESTAMP | 创建时间 |

层级示例：`工作/项目A/前端开发`
- `工作` (parent=NULL) → `项目A` (parent=工作) → `前端开发` (parent=项目A)

### 4.4 NoteTag (笔记-标签关联表)

| 字段 | 类型 | 说明 |
|------|------|------|
| note_id | UUID (FK → Note) | 笔记ID |
| tag_id | UUID (FK → Tag) | 标签ID |
| PRIMARY KEY | (note_id, tag_id) | 联合主键 |

### 4.5 Attachment (附件表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| note_id | UUID (FK → Note) | 所属笔记 |
| file_type | ENUM('image', 'audio', 'file') | 文件类型 |
| file_path | VARCHAR(255) | 存储路径 |
| original_name | VARCHAR(255) | 原始文件名 |
| file_size | INTEGER | 文件大小(字节) |
| created_at | TIMESTAMP | 创建时间 |

## 5. API 接口设计

### 5.1 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户名密码登录，返回JWT | ✗ |

### 5.2 笔记接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/notes` | 创建笔记 | ✓ |
| GET | `/api/notes` | 获取时间线笔记列表 (分页) | ✓ |
| GET | `/api/notes/{id}` | 获取单条笔记详情 | ✓ |
| PUT | `/api/notes/{id}` | 更新笔记 | ✓ |
| DELETE | `/api/notes/{id}` | 删除笔记 | ✓ |

### 5.3 标签接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/tags` | 创建标签 | ✓ |
| GET | `/api/tags` | 获取标签树 | ✓ |
| GET | `/api/tags/{id}/notes` | 获取某标签下所有笔记 (含子标签) | ✓ |

### 5.4 附件接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/notes/{id}/attachments` | 上传附件 | ✓ |
| GET | `/api/attachments/{id}` | 下载/预览附件 | ✓ |

## 6. 前端组件设计

### 6.1 页面组件

**Login.vue** - 登录页
- 用户名输入框
- 密码输入框
- 登录按钮
- 登录后跳转至时间线页

**Timeline.vue** - 笔记时间线
- 按时间倒序展示笔记卡片
- 上拉加载更多 (分页)
- 支持按标签筛选
- 空状态提示

**TagTree.vue** - 标签管理
- 树形展示层级标签
- 点击标签筛选笔记
- 支持展开/折叠子标签
- 新建标签入口

**Settings.vue** - 设置页
- 退出登录
- 关于信息

### 6.2 可复用组件

**NoteCard.vue** - 笔记卡片
- 显示笔记内容
- 显示关联标签 (支持层级展示)
- 显示附件缩略图 (图片) 或播放按钮 (语音)
- 显示时间
- 支持删除操作

**NoteEditor.vue** - 底部输入编辑器
- 多行文本输入框
- 工具栏：图片上传、语音录制、发送按钮
- 自动提取文本中的 `#标签`
- 移动端键盘适配

**BottomNav.vue** - 底部导航栏
- 三个标签页：笔记、标签、设置
- 当前页高亮

### 6.3 状态管理 (Pinia)

**auth.ts**
- `isLoggedIn`: boolean
- `token`: string | null
- `login(username, password)`: Promise
- `logout()`: void

**notes.ts**
- `notes`: Note[]
- `loading`: boolean
- `hasMore`: boolean
- `activeTag`: Tag | null
- `fetchNotes()`: Promise
- `createNote(content, tags, attachments)`: Promise
- `deleteNote(id)`: Promise
- `filterByTag(tagId)`: void

### 6.4 响应式适配

- 移动端：使用 `vw` + `rem` 单位
- 桌面端：居中容器，`max-width: 768px`
- 触摸优化：按钮最小 44px 点击区域
- UI风格：参照flomo的简洁设计

## 7. 核心交互流程

### 7.1 创建笔记

```
用户输入文字/选择图片/录制语音
    ↓
点击发送按钮
    ↓
前端调用 POST /api/notes (携带 JWT)
    ↓
后端：解析内容 → 提取标签(#开头) → 创建/关联标签 → 保存笔记 → 上传附件
    ↓
返回成功，前端时间线顶部插入新笔记
```

### 7.2 层级标签筛选

```
用户点击标签树中的某个标签
    ↓
前端调用 GET /api/tags/{id}/notes
    ↓
后端：递归查询该标签及所有子标签关联的笔记
    ↓
返回笔记列表，前端展示筛选结果
```

### 7.3 认证流程

```
用户打开应用
    ↓
检查本地 JWT 有效性
    ↓ (无效)
跳转登录页
    ↓
输入用户名密码 → POST /api/auth/login
    ↓
返回 JWT → 存储至 localStorage
    ↓
跳转时间线页
```

## 8. 文件存储策略

### MVP阶段
- 所有附件统一存放在 `attachment` 目录下
- 存储路径按日期分层：`YYYY/MM/DD/attachment/`
- 文件命名：`{type}_{YYYYMMDDTHHmmss}.{ext}`
- 示例：`2026/04/23/attachment/image_20260423T143025.jpg`
- 使用 `multipart/form-data` 上传

### 后续扩展
- 可替换为对象存储服务 (阿里云OSS/腾讯云COS)
- 仅需替换存储服务实现，不影响核心逻辑

## 9. 安全考虑

- 密码使用 bcrypt 加密
- JWT 有效期 7 天
- 文件上传限制大小 (图片 ≤ 5MB, 语音 ≤ 10MB)
- CORS 配置仅允许指定域名
- SQL注入防护 (使用 SQLAlchemy ORM)
