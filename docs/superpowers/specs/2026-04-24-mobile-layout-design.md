# 移动端布局重构设计文档

## 概述

参考 Flomo 的移动端交互模式，重构当前笔记应用的移动端布局。主要改动：
1. 移动端侧边栏改为抽屉式（汉堡菜单触发）
2. 搜索功能改为独立滑入页面
3. 桌面端保持现有固定侧边栏布局不变

## 架构设计

### 响应式断点
- **桌面端**: `> 768px` - 固定侧边栏布局
- **移动端**: `≤ 768px` - 抽屉式导航 + 顶部导航栏

### 组件结构

```
AppLayout.vue
├── MobileTopNav (仅移动端显示)
│   ├── HamburgerButton (打开抽屉)
│   ├── BrandTitle
│   └── SearchButton (打开搜索页)
├── SidebarDrawer (移动端抽屉)
│   ├── NavLinks
│   └── LogoutButton
├── DesktopSidebar (桌面端固定侧边栏，保持现有)
│   ├── SearchInput
│   ├── NavLinks
│   └── LogoutButton
└── SearchPage (移动端独立搜索页)
    ├── SearchBar
    ├── QuickFilters
    └── SearchResults
```

## 详细设计

### 1. 顶部导航栏 (MobileTopNav)

**位置**: `frontend/src/components/MobileTopNav.vue`（新建）

**功能**:
- 仅在移动端显示（`@media (max-width: 768px)`）
- 固定定位在页面顶部
- 左侧：汉堡菜单图标（三条横线），点击打开抽屉
- 中间：品牌名"我的笔记"
- 右侧：搜索图标，点击打开搜索页面

**样式**:
- 高度：56px
- 背景：白色/卡片背景色
- 底部边框：1px solid var(--border-color)
- z-index: 100

### 2. 抽屉式侧边栏 (SidebarDrawer)

**实现方式**: 集成到 `AppLayout.vue` 中，不新建组件

**功能**:
- 仅在移动端显示
- 默认隐藏，点击汉堡菜单后从左侧滑入
- 宽度：280px
- 包含：导航链接（全部笔记、标签、设置）、退出登录按钮
- **不包含搜索框**（搜索已移至独立页面）
- 打开时显示半透明遮罩，点击遮罩关闭抽屉

**动画**:
- 滑入/滑出：`transform: translateX(-100%)` → `translateX(0)`，过渡时间 0.3s
- 遮罩：`opacity: 0` → `opacity: 1`，过渡时间 0.3s

### 3. 搜索页面 (SearchPage)

**位置**: `frontend/src/components/SearchPage.vue`（新建）

**功能**:
- 仅在移动端显示
- 从右侧滑入，覆盖主内容区
- 顶部搜索栏：
  - 左侧：搜索图标
  - 中间：输入框（自动聚焦）
  - 右侧：过滤器图标 + 关闭按钮（X）
- 快捷搜索标签（MVP 阶段仅展示，后续实现）：
  - 无标签、有链接、有图片、有语音、那年今日
- 搜索结果区域：复用 `filteredNotes` 逻辑显示匹配笔记

**交互**:
- 打开时自动聚焦输入框
- 点击关闭按钮或点击遮罩关闭搜索页
- 输入内容实时过滤（复用 Store 的 `searchQuery`）

**样式**:
- 宽度：100%
- 高度：100vh
- 背景：白色/页面背景色
- z-index: 200（高于抽屉）

### 4. 桌面端适配

**AppLayout.vue 现有逻辑调整**:
- 搜索框仅在桌面端显示（`@media (min-width: 769px)`）
- 移动端隐藏侧边栏中的搜索框
- 主内容区在移动端移除 `margin-left`

## 数据流

```
用户点击搜索图标
  → SearchPage.show = true
  → 自动聚焦输入框
  → 用户输入
    → notesStore.searchQuery 更新
    → Timeline.vue 使用 filteredNotes 渲染
  → 用户点击关闭
    → SearchPage.show = false
    → notesStore.searchQuery 清空（可选）
```

## 文件清单

### 新建文件
- `frontend/src/components/MobileTopNav.vue` - 移动端顶部导航栏
- `frontend/src/components/SearchPage.vue` - 移动端搜索页面

### 修改文件
- `frontend/src/components/AppLayout.vue`
  - 添加汉堡菜单和抽屉逻辑
  - 分离桌面端/移动端侧边栏显示
  - 添加遮罩层
- `frontend/src/views/Timeline.vue`
  - 添加移动端顶部导航栏引用
  - 添加搜索页面引用
- `frontend/src/stores/notes.ts`
  - 添加 `clearSearch()` 方法（可选）

### 测试文件
- `frontend/src/components/MobileTopNav.test.ts` - 顶部导航栏测试
- `frontend/src/components/SearchPage.test.ts` - 搜索页面测试
- 更新 `frontend/src/components/AppLayout.test.ts` - 适配抽屉逻辑

## 技术细节

### 状态管理
- 使用 Pinia Store 或组件局部状态管理抽屉和搜索页的显示状态
- 推荐：在 `AppLayout.vue` 中使用局部 `ref` 管理，避免过度设计

### 动画实现
- 使用 CSS `transition` + `transform` 实现滑入/滑出效果
- 使用 `v-if` + CSS class 控制显示/隐藏
- 避免使用 JavaScript 动画库，保持轻量

### 可访问性
- 汉堡菜单按钮：`aria-label="打开菜单"`
- 搜索按钮：`aria-label="搜索笔记"`
- 关闭按钮：`aria-label="关闭搜索"`
- 抽屉打开时：主内容区 `aria-hidden="true"`

## 实施顺序

1. 创建 `MobileTopNav.vue` 组件
2. 创建 `SearchPage.vue` 组件
3. 修改 `AppLayout.vue` 添加抽屉逻辑
4. 修改 `Timeline.vue` 集成新组件
5. 编写单元测试
6. 手动测试移动端交互

## 注意事项

- 保持桌面端布局完全不变
- 搜索逻辑复用现有的 `filteredNotes` 计算属性
- 快捷搜索标签在 MVP 阶段仅做 UI 展示，后续迭代实现功能
- 确保触摸目标尺寸 ≥ 44px（移动端可访问性标准）
