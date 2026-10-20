# 旧易货 → 校园二手交易系统 数据迁移报告

- **迁移时间**: 2026/9/10 21:15:34
- **源站**: https://www.jiuyihuo.cn（robots.txt: User-agent: *
Disallow: → 允许爬取）
- **目标数据库**: campus_second_hand.t_item（UPSERT 策略，不破坏 t_order 等外键引用）

## 总览

| 指标 | 数量 |
|---|---|
| 源站商品总数 | 50 |
| 详情抓取成功 | 50 |
| 详情抓取失败 | 0 |
| 图片下载成功 | 49 |
| 图片下载失败 | 0 |
| 无图商品（源站用渐变占位） | 1 |
| SQL 行生成成功 | 50 |
| SQL 行校验失败 | 0 |
| 导入后 t_item 总行数 | 51 |

## 数据映射规则

| 源字段 | 目标字段 | 规则 |
|---|---|---|
| id | item_id | 1:1 对齐，便于校验 |
| user_id | user_id | 本地 1/2/3 轮转 ((id-1)%3+1) |
| category_id | category_id | 1→1教材 2→2电子 3→3生活 4→5服饰 5考研→1教材 6/7/8→6其他 |
| title | title | 原样（≤100 字符） |
| description | description | NULL → "暂无描述" |
| price / original_price | price / original_price | 数值化保留 2 位 |
| condition + badge + tags | condition_level | 全新→1 几乎全新/95/99新→2 9成新→3 8成新→4 磨损→5 默认3 |
| cover_image | images | 下载至 /item-img/p{id}_文件名，DB 存本地路径 |
| status | status | 1→1 在售，其他→2 下架 |
| views | view_count | 原样 |
| created_at / updated_at | create_time / update_time | 原样截取 yyyy-MM-dd HH:mm:ss |

## 失败明细

（无失败项 ✓）

## 无图商品清单（共 1 件，前端显示渐变占位）

- 52: 95新床上书桌

## 遗留数据与前端适配处理（人工备注）

1. **遗留行本地化**：本地库原有一行 `item_id=8`（大学英语四六级真题套卷，旧会话数据，
   源站 id 序列中无 8）。因被 `t_order` 引用不可删除，已将其远程图片 URL 更新为本地路径
   `/item-img/civil_service_exam.webp`。迁移完成后 `t_item` 中远程图片 URL 残留 = 0。
2. **前端图片判定修复**：`ItemCard.vue` / `ItemDetailView.vue` / `ChatView.vue` /
   `OrdersView.vue` / `PriceChangeDialog.vue` 中原有 `images.startsWith('http')` 判断，
   导致本地路径 `/item-img/...` 被误判为"无图"而回退到 emoji 占位。已统一修复为
   非空即渲染 `<img>`，修复后浏览器实测图片全部正常加载（见"测试记录"）。

## 测试记录（2026-09-10）

- MySQL 抽样查询：中文无乱码，价格/成色/浏览量/时间与源站一致
- 图片完整性：DB 中 49 条 `/item-img/` 路径逐一比对本地文件 → **全部存在，0 缺失**
- HTTP 验证：`http://localhost:5173/item-img/p1_math_textbook.webp` 等 → **200 image/webp**
- 后端 API：`GET /api/items`、`GET /api/items/2` → **200**，返回迁移后数据（中文正常）
- 浏览器端到端：登录张三 → 首页显示 50 件商品，热门交易卡片渲染真实图片（教材/鼠标/瑜伽垫/床上书桌）✓
- 生产构建：`vite build` ✓ 11.41s 无错误

## 断点续传说明

进度保存在 `scripts/migration-output/checkpoint.json`。中断后重新运行本脚本会自动跳过已完成的
列表分页 / 详情抓取 / 图片下载 / SQL 生成 / 导入步骤。使用 `--fresh` 参数可强制从头迁移。
