# 校园二手物品交易系统 —— Vue3 前端

与课程作业后端（`D:\campus-backend`，Spring Boot 3.4.5 @ 8080）配套的前端工程。
结构与老师演示的「Vue3 + Vite + Tailwind + Pinia」范例保持一致，业务为 **校园二手物品交易**。

## 技术栈

- Vue 3.5 + Vite 6（dev server 5173，`/api` 已代理到后端 8080）
- Tailwind CSS v4 + lucide-vue-next 图标
- Pinia（会话状态）+ Vue Router（hash 路由）+ Axios（真实后端请求）

## 启动

```bash
# 1. 先启动后端：D:\campus-backend（Spring Boot @ 8080，需 MySQL 已建库 campus_second_hand）
# 2. 启动前端
npm install
npm run dev
# 浏览器打开 http://localhost:5173/
```

## 演示账号（密码统一 123456）

| 角色 | 账号 |
|---|---|
| 普通用户（买家/卖家一体） | 张三 / 李四 / 王五 |
| 管理员 | admin |

## 页面地图

| 角色 | 页面 | 对接后端模块 |
|---|---|---|
| 公共 | 登录（可注册） | /api/auth |
| 用户 | 首页 | categories / items / favorites / messages |
| 用户 | 商品广场（游标分页） | /api/items/page |
| 用户 | 商品详情（联系/收藏/举报/评价） | items / favorites / messages / reports / reviews |
| 用户 | 发布闲置 | /api/items (POST) |
| 用户 | 我的（资料编辑 / 发布管理 / 收藏） | users / items / favorites |
| 用户 | 站内信（收发/已读/回复） | /api/messages |
| 管理员 | 运营总览 | /api/admin/stats |
| 管理员 | 商品管理（上下架/删除） | /api/admin/items、/api/items |
| 管理员 | 用户管理（禁用/启用） | /api/admin/users |
| 管理员 | 举报处理（下架+处理/驳回） | /api/reports、/api/admin |

## 结构

```
src/
├── api/index.js        # Axios 封装，全部后端接口
├── store/auth.js       # 登录会话（用户/管理员）
├── utils/              # toast 提示 + 业务字典/格式化
├── layouts/MainLayout.vue
├── components/         # StatCard / ItemCard
└── views/              # LoginView + user(6) + admin(4) + 商品详情(1)
```
