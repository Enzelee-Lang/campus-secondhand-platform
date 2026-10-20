// 作业14：系统说明文档 WORD → docx
const docx = require('docx');
const fs = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun,
  ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType
} = docx;

const src = 'c:/Users/李恩泽/AppData/Local/Temp/trae/screenshots';
const outDir = 'd:/campus-backend/docs';

function img(filename, w, h) {
  const p = path.join(src, filename);
  if (!fs.existsSync(p)) return null;
  return new ImageRun({ data: fs.readFileSync(p), transformation: { width: w, height: h } });
}
function h1(text) { return new Paragraph({ children: [new TextRun({ text, bold: true, size: 40, font: 'Microsoft YaHei', color: '1E40AF' })], spacing: { before: 320, after: 140 } }); }
function h2(text) { return new Paragraph({ children: [new TextRun({ text, bold: true, size: 30, font: 'Microsoft YaHei', color: '2563EB' })], spacing: { before: 260, after: 100 } }); }
function h3(text) { return new Paragraph({ children: [new TextRun({ text, bold: true, size: 25, font: 'Microsoft YaHei' })], spacing: { before: 180, after: 80 } }); }
function p(text) { return new Paragraph({ children: [new TextRun({ text, size: 22, font: 'Microsoft YaHei' })], spacing: { after: 80 } }); }
function code(text) { return new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Consolas' })], indent: { left: 360 }, shading: { type: ShadingType.SOLID, color: 'F5F5F5' }, spacing: { after: 40 } }); }
function bold(text) { return new TextRun({ text, bold: true, size: 22, font: 'Microsoft YaHei' }); }
function pic(filename, w, h, caption) {
  const im = img(filename, w, h);
  if (!im) return [];
  const items = [new Paragraph({ children: [im], alignment: AlignmentType.CENTER, spacing: { after: 60 } })];
  if (caption) items.push(new Paragraph({ children: [new TextRun({ text: caption, italics: true, size: 20, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 140 } }));
  return items;
}
function makeTable(headers, rows, colWidths) {
  const hdrRow = new TableRow({ tableHeader: true, children: headers.map((h, i) =>
    new TableCell({ children: [new Paragraph({ children: [bold(h)] })], width: { size: colWidths[i], type: WidthType.DXA } })
  )});
  const bodyRows = rows.map(r => new TableRow({ children: r.map((cell, i) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20, font: 'Microsoft YaHei' })] })], width: { size: colWidths[i], type: WidthType.DXA } })
  )}));
  return new Table({ rows: [hdrRow, ...bodyRows], width: { size: colWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA } });
}

const children = [
  // 封面
  new Paragraph({ children: [new TextRun({ text: '校园二手物品交易系统', bold: true, size: 56, font: 'Microsoft YaHei', color: '1E40AF' })], alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 } }),
  new Paragraph({ children: [new TextRun({ text: '系统说明文档', bold: true, size: 44, font: 'Microsoft YaHei', color: '1E40AF' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
  makeTable(['项目','内容'], [
    ['文档版本','V1.0'],
    ['编写日期','2026-09-09'],
    ['系统名称','校园二手物品交易系统（Campus Second-hand Trading System）'],
    ['技术架构','前后端分离：Spring Boot + Vue 3'],
    ['开发环境','JDK 21 / Node.js 24 / MySQL 8.0'],
  ], [2200, 5800]),
  p(''),

  // 一、项目简介
  h1('一、项目简介'),
  h2('1.1 项目背景'),
  p('高校校园内每年产生大量闲置物品（教材、电子产品、生活用品等），毕业生处理旧物、低年级学生求购便宜物品的需求长期存在。传统线下跳蚤市场时间固定、信息传播有限；大型二手平台面向社会人员，缺少校园场景的信任感与便捷性。本系统面向在校师生，提供一个发布、浏览、交易二手物品的专用平台。'),
  h2('1.2 项目目标'),
  p('· 为学生提供闲置物品发布、浏览、搜索、收藏、咨询的一站式线上平台；'),
  p('· 为买卖双方提供站内消息沟通、商品评价、违规举报等闭环机制；'),
  p('· 为管理员提供用户管理、商品审核、举报处理、运营统计的后台管理能力；'),
  p('· 系统采用前后端分离架构，界面友好、响应迅速、数据安全。'),
  h2('1.3 系统角色'),
  makeTable(['角色','说明','主要权限'], [
    ['普通用户（买家/卖家）','在校学生，学号注册','发布商品、浏览搜索、收藏、发消息、评价、举报'],
    ['管理员','平台运营人员','用户启用/禁用、商品下架、分类管理、举报处理、运营统计'],
  ], [2200, 2800, 3000]),
  p(''),

  // 二、技术架构
  h1('二、系统技术架构'),
  h2('2.1 总体架构'),
  p('系统采用前后端分离架构：前端 Vue 3 单页应用通过 HTTP 调用后端 RESTful API；后端 Spring Boot 提供接口服务，JPA/Hibernate 操作 MySQL 数据库。'),
  code('┌─────────────────┐      HTTP/JSON       ┌──────────────────┐      JPA       ┌──────────┐'),
  code('│  前端 Vue 3 SPA │  ──────────────────▶ │ Spring Boot 3.4  │  ───────────▶ │ MySQL 8  │'),
  code('│  Element Plus   │  ◀────────────────── │ REST Controller  │  ◀─────────── │  6 张表   │'),
  code('│  Vite :5173     │    Result{code,data} │   :8080          │               └──────────┘'),
  code('└─────────────────┘                      └──────────────────┘'),
  h2('2.2 技术选型'),
  makeTable(['层次','技术','版本','用途'], [
    ['前端框架','Vue 3 + Vite','3.x / 6.x','单页应用框架与构建工具'],
    ['UI 组件','Element Plus','2.x','表格、表单、弹窗等组件'],
    ['HTTP 客户端','Axios','1.x','接口调用、统一拦截器'],
    ['路由','Vue Router','4.x','Hash 路由与角色守卫'],
    ['后端框架','Spring Boot','3.4.5','Web 容器、自动装配'],
    ['ORM','Spring Data JPA / Hibernate','随 Boot','对象关系映射、分页'],
    ['数据库','MySQL','8.0','业务数据存储'],
    ['连接池','HikariCP','随 Boot','默认数据库连接池'],
    ['密码加密','MD5（工具类）','-','用户密码摘要存储'],
    ['测试','JUnit 5 + Mockito + JaCoCo','-','单元测试与覆盖率'],
  ], [1600, 2600, 1400, 2400]),
  p(''),
  h2('2.3 工程结构'),
  code('campus-backend/                    exam-tutor-frontend/'),
  code('├─ src/main/java/com/campus/       ├─ src/'),
  code('│  ├─ controller/   (10个)          │  ├─ api/index.js      (41个API封装)'),
  code('│  ├─ entity/       (9个实体)        │  ├─ views/            (11个页面)'),
  code('│  ├─ repository/   (9个DAO)        │  │  ├─ user/  (7个用户端页面)'),
  code('│  ├─ dto/          (请求DTO)       │  │  └─ admin/ (4个管理端页面)'),
  code('│  ├─ common/Result (统一响应)      │  ├─ router/  (路由+角色守卫)'),
  code('│  └─ util/Md5Util                 │  └─ main.js'),
  code('└─ src/test/        (10测试类/71用例)└─ vite.config.js (/api 代理→8080)'),

  // 三、功能模块说明
  h1('三、功能模块说明'),
  p('系统共 39 个业务接口、11 个前端页面，分为用户端与管理端两大部分。'),
  h2('3.1 用户端功能（7 大模块）'),
  makeTable(['模块','功能点','对应页面'], [
    ['认证','注册（用户名/学号唯一校验）、登录（用户/管理员分流）、账号禁用拦截','登录页'],
    ['工作台','我的发布/收藏/评价/未读消息统计卡片、快捷入口、商品推荐','首页'],
    ['商品广场','分类筛选、成色筛选、关键词搜索、游标分页加载','商品广场'],
    ['商品详情','商品信息展示、浏览量自动+1、收藏、联系卖家发消息、评价列表、卖家回复、举报入口、发布者信息','商品详情'],
    ['发布商品','分类下拉、成色选择、价格/原价录入、自动上架','发布页'],
    ['我的','个人信息编辑（邮箱/电话/学校/头像）、我发布的商品（改价/下架/删除）、我的收藏','我的页面'],
    ['站内信','收件箱/发件箱、未读数标记、消息已读、按用户与商品关联会话','消息页'],
  ], [1400, 4400, 1600]),
  p(''),
  h2('3.2 管理端功能（4 大模块）'),
  makeTable(['模块','功能点','对应页面'], [
    ['运营仪表盘','用户数/商品数/管理员数/待处理举报统计、最新商品、待处理举报列表','仪表盘'],
    ['商品管理','商品列表、筛选搜索、修改、删除、下架、CSV 导出、分类管理（新增/删除分类）','商品管理'],
    ['用户管理','用户列表、模糊搜索、按学号精确查找、启用/禁用账号','用户管理'],
    ['举报处理','举报列表、按状态筛选、举报处理（通过/驳回）、关联商品下架','举报管理'],
  ], [1400, 4400, 1600]),
  p(''),
  h2('3.3 功能界面展示'),
  ...pic('01-login-page.png', 600, 350, '图 3-1 登录页：用户/管理员角色切换，演示账号一键填入'),
  ...pic('02-user-homepage.png', 600, 370, '图 3-2 用户工作台：统计卡片、快捷入口与商品推荐'),
  ...pic('03-market-page.png', 600, 350, '图 3-3 商品广场：分类/成色筛选与关键词搜索'),
  ...pic('04-publish-form.png', 600, 370, '图 3-4 发布商品表单'),
  ...pic('05-user-mine.png', 600, 370, '图 3-5 我的页面：信息编辑与商品管理'),
  ...pic('06-admin-dashboard.png', 600, 350, '图 3-6 管理端仪表盘：运营统计概览'),
  ...pic('07-admin-users.png', 600, 350, '图 3-7 用户管理：搜索与账号禁用/启用'),
  ...pic('08-admin-items.png', 600, 370, '图 3-8 商品管理：下架、CSV 导出与分类管理'),

  // 四、数据库设计
  h1('四、数据库设计'),
  p('数据库名 campus_second_hand，共 6 张业务表，InnoDB 引擎、utf8mb4 字符集。'),
  h2('4.1 表结构清单'),
  makeTable(['表名','说明','主要字段'], [
    ['t_user','注册用户','user_id, username, password(MD5), student_id, email, phone, avatar, school_name, status, create_time'],
    ['t_admin','管理员','admin_id, username, password, role, status, create_time'],
    ['t_category','商品分类','category_id, name, sort_order'],
    ['t_item','商品','item_id, user_id, category_id, title, description, price, original_price, condition_level, status, view_count, create_time'],
    ['t_favorite','收藏','favorite_id, user_id, item_id, create_time（user_id+item_id 联合唯一）'],
    ['t_review','评价/回复','review_id, reviewer_id, target_user_id, item_id, rating(1-5), content, reply, create_time'],
    ['t_message','站内消息','msg_id, sender_id, receiver_id, item_id, content, is_read, create_time'],
    ['t_report','举报','report_id, reporter_id, item_id, reason, status(0待处理/1已处理), create_time'],
  ], [1600, 1400, 5000]),
  p(''),
  h2('4.2 实体关系（ER 说明）'),
  code('t_user 1──* t_item    （一个用户发布多个商品）'),
  code('t_category 1──* t_item（一个分类包含多个商品）'),
  code('t_user 1──* t_favorite *──1 t_item（用户-商品 多对多收藏）'),
  code('t_user 1──* t_review  （评价人/被评价人 双外键）'),
  code('t_item 1──* t_review  （一个商品可有多条评价）'),
  code('t_user 1──* t_message *──1 t_user（发件人/收件人）'),
  code('t_item 1──* t_report  （一个商品可被多次举报）'),

  // 五、接口设计
  h1('五、接口设计说明'),
  h2('5.1 统一响应结构'),
  p('所有接口返回统一 JSON 结构（CSV 导出接口除外，直接返回文件流）：'),
  code('{ "code": 200, "message": "success", "data": {...} }   // code=200 成功；404 资源不存在；500 业务错误'),
  h2('5.2 接口模块分布'),
  makeTable(['模块','路径前缀','接口数','主要功能'], [
    ['认证','/api/auth','2','注册、登录'],
    ['用户','/api/users','4','列表、详情、按学号查、修改信息'],
    ['商品','/api/items','8','分页、全量、详情、发布、修改、删除、按用户查、CSV 导出'],
    ['分类','/api/categories','3','列表、新增、删除'],
    ['评价','/api/reviews','4','按用户/商品查、发表、卖家回复'],
    ['收藏','/api/favorites','3','我的收藏、添加、取消'],
    ['消息','/api/messages','5','发送、收件箱、发件箱、未读数、标记已读'],
    ['举报','/api/reports','3','提交、列表、处理'],
    ['管理端','/api/admin','5','运营统计、用户列表、启用禁用、商品列表、下架'],
    ['系统','/ 与 /api/health','2','系统信息、健康检查'],
  ], [1200, 2000, 1000, 3800]),
  p(''),
  p('接口在线调试：启动后端后访问 http://127.0.0.1:8080/api-console.html 可进行可视化接口联调。'),

  // 六、部署运行说明
  h1('六、环境部署与运行说明'),
  h2('6.1 环境要求'),
  makeTable(['软件','版本要求','备注'], [
    ['JDK','21+','Spring Boot 3.x 最低要求 JDK 17'],
    ['MySQL','8.0+','账号 root/123456（见 application.properties）'],
    ['Node.js','18+（推荐 24）','前端构建与启动'],
    ['Maven','3.8+ 或使用项目自带 mvnw','无需单独安装'],
  ], [1600, 2800, 3600]),
  p(''),
  h2('6.2 后端启动'),
  code('1. MySQL 中创建数据库：CREATE DATABASE campus_second_hand DEFAULT CHARSET utf8mb4;'),
  code('   （表结构由 JPA ddl-auto=update 自动创建，种子数据见 src/main/resources/data.sql）'),
  code('2. 进入后端目录：cd campus-backend'),
  code('3. 启动：mvnw spring-boot:run   （或 IDE 中运行 CampusBackendApplication）'),
  code('4. 验证：浏览器访问 http://127.0.0.1:8080/api/health 返回 {"code":200}'),
  h2('6.3 前端启动'),
  code('1. 进入前端目录：cd exam-tutor-frontend'),
  code('2. 安装依赖：npm install'),
  code('3. 启动开发服务器：npm run dev'),
  code('4. 访问：http://127.0.0.1:5173 （Vite 已配置 /api 代理到 8080 端口）'),
  h2('6.4 演示账号'),
  makeTable(['角色','用户名','密码'], [
    ['管理员','admin','123456'],
    ['普通用户','张三 / 李四 / 王五','123456'],
  ], [2000, 3000, 3000]),
  p(''),

  // 七、测试情况
  h1('七、系统测试情况'),
  p('系统经过功能、性能、安全、单元四个维度共 109 项测试，107 项通过，总体通过率 98.2%：'),
  makeTable(['测试类别','用例数','通过率','关键结果'], [
    ['功能测试','20','100%','10 个业务模块流程闭环正常'],
    ['性能测试','8','100%','核心接口 P95 < 120ms，100 并发零错误'],
    ['安全测试','10','80%','SQL 注入/XSS/越权/信息泄露均拦截（2 项加固建议）'],
    ['单元测试','71','100%','JaCoCo 指令覆盖率 59%，AuthController 达 97%'],
  ], [1600, 1200, 1200, 4000]),
  p(''),

  // 八、总结
  h1('八、项目总结'),
  p('本系统完整实现了校园二手物品交易的核心业务闭环：学生可发布商品、按分类与关键词浏览搜索、收藏心仪物品、通过站内消息与卖家沟通、交易后互评并可举报违规；管理员可进行用户管控、商品下架、分类维护、举报处理并查看运营统计。'),
  p('项目采用 Spring Boot + Vue 3 前后端分离架构，共 39 个 RESTful 接口、41 个前端 API 封装、11 个页面，接口对接率 100%。配套完成了单元测试（71 用例/59% 覆盖率）、系统测试（109 项/98.2% 通过率）与完整文档，达到课程设计的预期目标。'),
];

const doc = new Document({
  sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }]
});

Packer.toBuffer(doc).then(buf => {
  const fp = path.join(outDir, '系统说明文档.docx');
  fs.writeFileSync(fp, buf);
  console.log('生成成功:', fp, '(' + (buf.length / 1024).toFixed(1) + ' KB)');
});
