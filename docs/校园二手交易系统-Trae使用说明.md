# 校园二手交易系统 · Trae CN 使用说明

## 一、工程结构（多根工作区）

| 工程 | 路径 | 技术栈 | 端口 |
|---|---|---|---|
| 后端 campus-backend | `D:\campus-backend` | Spring Boot 3.4.5 + JPA + MySQL | 8080 |
| 前端 exam-tutor-frontend | `D:\exam-tutor-frontend` | Vue 3.5 + Vite + Pinia + Tailwind | 5173 |

两个工程通过桌面上的工作区文件 **`校园二手交易系统.code-workspace`** 绑定，
在 Trae CN 左侧资源管理器可同时看到两个根文件夹，分别启动、互不干扰。

---

## 二、如何打开

1. **双击桌面「Trae CN」图标**启动 IDE（必须自己双击，从其他程序后台拉起会崩溃）。
2. 双击桌面上 **`校园二手交易系统.code-workspace`** 文件 → 加载双工程视图。
   （或在 Trae CN 内：文件 → 打开工作区 → 选择该文件）

---

## 三、启动顺序（首次/每次开机后）

### 第 1 步：启动 MySQL
- 双击桌面 **`start_mysql.bat`**（需以管理员身份运行，右键 → 以管理员身份运行）。
- 确认成功：任务管理器里可见 `mysqld.exe`。

### 第 2 步：启动后端（8080）
在 Trae CN 打开 campus-backend 的终端，执行：

```bash
mvn spring-boot:run
```

- 首次会自动下载依赖（较慢）；后续启动快。
- 启动成功标志：日志出现 `Started CampusApplication`，访问
  http://localhost:8080/swagger-ui.html 能看到接口文档。

### 第 3 步：启动前端（5173）
在 Trae CN 打开 exam-tutor-frontend 的终端，执行：

```bash
npm install   # 仅首次或依赖变化时执行
npm run dev
```

- 启动成功标志：终端显示 `Local: http://localhost:5173/`。
- 浏览器访问 **http://localhost:5173** 即系统页面。

---

## 四、演示账号（密码均为 123456）

| 角色 | 账号 |
|---|---|
| 普通用户 | 张三 / 李四 / 王五 |
| 管理员 | admin |

---

## 五、端口冲突处理

- 若 8080 被占用：`netstat -ano | findstr 8080` 找到 PID → 任务管理器结束该进程，
  或改用 `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081` 换端口（前端代理需同步改）。
- 若 5173 被占用：Vite 会自动改用 5174，以终端提示为准。

---

## 六、常用验证链接

| 内容 | 地址 |
|---|---|
| 前端系统 | http://localhost:5173 |
| 后端 Swagger 文档 | http://localhost:8080/swagger-ui.html |
| 数据库 | MySQL 9.5，库名 `campus_second_hand`，root / 123456 |

---

*生成时间：2026-09-03*
