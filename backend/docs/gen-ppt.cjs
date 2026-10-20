// 作业14：系统说明 PPT → pptx（16:9，含演讲备注，可导出 MP4）
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SRC = 'c:/Users/李恩泽/AppData/Local/Temp/trae/screenshots';
const OUT = 'd:/campus-backend/docs/系统说明PPT.pptx';

// 读取 PNG 实际尺寸
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inch
pptx.author = '校园二手交易系统';
pptx.title = '校园二手物品交易系统 - 系统说明';

const C = { dark: '1E3A8A', blue: '2563EB', light: 'EFF6FF', gray: '64748B', darkgray: '334155', white: 'FFFFFF' };

// 通用：标题栏
function titleBar(slide, title, sub) {
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: C.dark } });
  slide.addShape('rect', { x: 0, y: 1.0, w: 13.33, h: 0.06, fill: { color: C.blue } });
  slide.addText(title, { x: 0.5, y: 0.12, w: 11, h: 0.55, fontSize: 26, bold: true, color: C.white, fontFace: 'Microsoft YaHei' });
  if (sub) slide.addText(sub, { x: 0.5, y: 0.62, w: 12, h: 0.3, fontSize: 12, color: 'BFDBFE', fontFace: 'Microsoft YaHei' });
  slide.addText('校园二手物品交易系统', { x: 10.8, y: 7.15, w: 2.3, h: 0.3, fontSize: 10, color: C.gray, align: 'right' });
}

// 通用：双截图页（自动按 PNG 比例适配）
function twoShots(file1, cap1, file2, cap2) {
  const s = pptx.addSlide();
  titleBar(s, '功能界面展示', cap1.split('：')[0] + ' / ' + cap2.split('：')[0]);
  [[file1, cap1, 0.35], [file2, cap2, 6.85]].forEach(([f, cap, x]) => {
    const fp = path.join(SRC, f);
    const { w: pw, h: ph } = pngSize(fp);
    const maxW = 6.1, maxH = 4.6;
    let w = maxW, h = w * ph / pw;
    if (h > maxH) { h = maxH; w = h * pw / ph; }
    s.addImage({ path: fp, x: x + (maxW - w) / 2, y: 1.35, w, h });
    s.addText(cap, { x, y: 6.15, w: 6.1, h: 0.5, fontSize: 13, color: C.darkgray, align: 'center', fontFace: 'Microsoft YaHei', bold: true });
  });
  return s;
}

function bullet(slide, items, x, y, w, size) {
  slide.addText(items.map(t => ({ text: t, options: { bullet: { code: '2022' }, breakLine: true } })),
    { x, y, w, h: 4.5, fontSize: size || 16, color: C.darkgray, fontFace: 'Microsoft YaHei', lineSpacingMultiple: 1.35, valign: 'top' });
}

// ===== 1. 封面 =====
let s = pptx.addSlide();
s.addShape('rect', { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: C.dark } });
s.addShape('rect', { x: 0, y: 5.4, w: 13.33, h: 0.08, fill: { color: '60A5FA' } });
s.addText('校园二手物品交易系统', { x: 1, y: 2.2, w: 11.3, h: 1.0, fontSize: 44, bold: true, color: C.white, align: 'center', fontFace: 'Microsoft YaHei' });
s.addText('Campus Second-hand Trading System', { x: 1, y: 3.3, w: 11.3, h: 0.5, fontSize: 18, color: '93C5FD', align: 'center', fontFace: 'Segoe UI' });
s.addText('系统说明文档  ·  项目答辩', { x: 1, y: 4.2, w: 11.3, h: 0.6, fontSize: 22, color: 'BFDBFE', align: 'center', fontFace: 'Microsoft YaHei' });
s.addText('技术栈：Spring Boot 3 + Vue 3 + MySQL    |    2026 年 9 月', { x: 1, y: 5.8, w: 11.3, h: 0.5, fontSize: 14, color: '93C5FD', align: 'center', fontFace: 'Microsoft YaHei' });
s.addNotes('各位老师好，我们组的课程设计题目是《校园二手物品交易系统》。系统采用前后端分离架构，后端使用 Spring Boot，前端使用 Vue 3，数据库使用 MySQL。下面从项目背景、技术架构、功能实现、数据库与测试几个方面进行汇报。');

// ===== 2. 目录 =====
s = pptx.addSlide();
titleBar(s, '目录', 'CONTENTS');
[
  ['01', '项目背景与目标'],
  ['02', '系统角色与技术架构'],
  ['03', '功能模块与界面展示'],
  ['04', '数据库与接口设计'],
  ['05', '系统测试与质量'],
  ['06', '部署运行与总结'],
].forEach(([num, t], i) => {
  const y = 1.5 + i * 0.85;
  s.addShape('roundRect', { x: 2.2, y, w: 0.7, h: 0.6, rectRadius: 0.08, fill: { color: C.blue } });
  s.addText(num, { x: 2.2, y: y + 0.06, w: 0.7, h: 0.5, fontSize: 20, bold: true, color: C.white, align: 'center', fontFace: 'Segoe UI' });
  s.addText(t, { x: 3.2, y: y + 0.05, w: 7, h: 0.5, fontSize: 20, color: C.darkgray, fontFace: 'Microsoft YaHei' });
});
s.addNotes('汇报分为六个部分：首先介绍项目背景和目标，然后说明系统角色与技术架构，第三部分重点演示功能模块与实际界面，第四部分介绍数据库与接口设计，第五部分汇报测试情况，最后是部署说明和总结。');

// ===== 3. 项目背景 =====
s = pptx.addSlide();
titleBar(s, '一、项目背景与目标');
s.addShape('roundRect', { x: 0.5, y: 1.4, w: 6.0, h: 5.4, rectRadius: 0.1, fill: { color: C.light } });
s.addText('项目背景', { x: 0.8, y: 1.6, w: 5.4, h: 0.5, fontSize: 20, bold: true, color: C.dark, fontFace: 'Microsoft YaHei' });
bullet(s, [
  '高校每年产生大量闲置教材、电子产品、生活用品',
  '线下跳蚤市场时间固定、信息传播范围有限',
  '社会二手平台缺乏校园场景的信任感与便捷性',
  '毕业生处理旧物、低年级学生求购需求长期存在',
], 0.8, 2.2, 5.5, 15);
s.addShape('roundRect', { x: 6.85, y: 1.4, w: 6.0, h: 5.4, rectRadius: 0.1, fill: { color: 'F0FDF4' } });
s.addText('建设目标', { x: 7.15, y: 1.6, w: 5.4, h: 0.5, fontSize: 20, bold: true, color: '15803D', fontFace: 'Microsoft YaHei' });
bullet(s, [
  '提供闲置物品发布、浏览、搜索、收藏、咨询一站式服务',
  '站内消息沟通、商品评价、违规举报形成交易闭环',
  '管理员可进行用户管理、商品下架、举报处理、运营统计',
  '前后端分离架构，界面友好、响应迅速、数据安全',
], 7.15, 2.2, 5.5, 15);
s.addNotes('校园内每年毕业季和开学季都会产生大量闲置物品。线下跳蚤市场时间固定、覆盖人群有限，而社会二手平台面向所有人，缺少校园内部的信任感。因此我们设计了这个面向在校师生的二手交易平台，目标是让学生方便地发布和淘二手物品，同时为管理员提供后台管控能力。');

// ===== 4. 系统角色 =====
s = pptx.addSlide();
titleBar(s, '二、系统角色');
s.addShape('roundRect', { x: 0.8, y: 1.6, w: 5.5, h: 4.8, rectRadius: 0.1, fill: { color: C.white, line: { color: C.blue, width: 1.5 } } });
s.addText('普通用户（买家 / 卖家）', { x: 1.1, y: 1.85, w: 4.9, h: 0.5, fontSize: 19, bold: true, color: C.blue, fontFace: 'Microsoft YaHei' });
bullet(s, [
  '学号注册登录，个人信息维护',
  '发布商品（分类、成色、价格）',
  '浏览广场：分类/成色筛选、关键词搜索',
  '收藏商品、站内信联系卖家',
  '交易后评价、可回复、可举报',
], 1.1, 2.5, 5.0, 15);
s.addShape('roundRect', { x: 7.0, y: 1.6, w: 5.5, h: 4.8, rectRadius: 0.1, fill: { color: C.white, line: { color: 'DC2626', width: 1.5 } } });
s.addText('管理员', { x: 7.3, y: 1.85, w: 4.9, h: 0.5, fontSize: 19, bold: true, color: 'DC2626', fontFace: 'Microsoft YaHei' });
bullet(s, [
  '运营仪表盘：用户/商品/举报数据统计',
  '用户管理：搜索、按学号查找、启用禁用',
  '商品管理：下架、删除、CSV 导出',
  '分类管理：新增、删除商品分类',
  '举报处理：审核举报、关联商品下架',
], 7.3, 2.5, 5.0, 15);
s.addNotes('系统有两类角色。普通用户通过学号注册，可以发布商品、浏览搜索、收藏、发消息沟通、评价和举报。管理员则负责平台运营，包括查看统计数据、禁用违规用户、下架商品、维护分类和处理举报。两类角色登录入口分开，权限通过前端路由守卫和后端接口共同保障。');

// ===== 5. 技术架构 =====
s = pptx.addSlide();
titleBar(s, '二、技术架构：前后端分离');
s.addShape('roundRect', { x: 0.6, y: 2.6, w: 3.4, h: 2.2, rectRadius: 0.12, fill: { color: 'DBEAFE' } });
s.addText('前端\nVue 3 + Vite\nElement Plus\nAxios / Vue Router\n:5173', { x: 0.8, y: 2.85, w: 3.0, h: 1.7, fontSize: 15, color: C.dark, align: 'center', fontFace: 'Microsoft YaHei', valign: 'middle' });
s.addShape('roundRect', { x: 4.9, y: 2.6, w: 3.5, h: 2.2, rectRadius: 0.12, fill: { color: 'BFDBFE' } });
s.addText('后端\nSpring Boot 3.4.5\nREST Controller ×10\nSpring Data JPA\n:8080', { x: 5.1, y: 2.85, w: 3.1, h: 1.7, fontSize: 15, color: C.dark, align: 'center', fontFace: 'Microsoft YaHei', valign: 'middle' });
s.addShape('roundRect', { x: 9.3, y: 2.6, w: 3.4, h: 2.2, rectRadius: 0.12, fill: { color: '93C5FD' } });
s.addText('数据库\nMySQL 8.0\n8 张数据表\nHikariCP 连接池\nJPA 自动建表', { x: 9.5, y: 2.85, w: 3.0, h: 1.7, fontSize: 15, color: '1E3A8A', align: 'center', fontFace: 'Microsoft YaHei', valign: 'middle' });
s.addText('HTTP / JSON  →  Result{ code, message, data }', { x: 3.7, y: 1.9, w: 5.8, h: 0.4, fontSize: 13, color: C.gray, align: 'center', fontFace: 'Microsoft YaHei' });
s.addText('←  RESTful API  (39 个接口)  →', { x: 4.1, y: 4.9, w: 5, h: 0.4, fontSize: 13, color: C.gray, align: 'center', fontFace: 'Microsoft YaHei' });
s.addText('JPA / Hibernate', { x: 8.7, y: 4.9, w: 2.2, h: 0.4, fontSize: 13, color: C.gray, align: 'center', fontFace: 'Microsoft YaHei' });
s.addText('前端开发环境通过 Vite 代理把 /api 请求转发到后端 8080 端口，解决跨域；所有接口返回统一的 Result 结构，前端 axios 拦截器统一处理。', { x: 0.8, y: 5.7, w: 11.8, h: 0.9, fontSize: 13, color: C.darkgray, fontFace: 'Microsoft YaHei' });
s.addNotes('系统采用经典的三层架构：前端是 Vue 3 单页应用，运行在 5173 端口；后端是 Spring Boot，运行在 8080 端口，包含 10 个 Controller 共 39 个 REST 接口；数据库是 MySQL，共 8 张表，通过 JPA 自动建表。前后端之间用 HTTP JSON 通信，响应统一包装为 Result 结构，前端用 axios 拦截器统一处理成功和错误。');

// ===== 6. 功能模块总览 =====
s = pptx.addSlide();
titleBar(s, '三、功能模块总览');
s.addText('用户端（7 大模块 / 7 个页面）', { x: 0.6, y: 1.35, w: 6, h: 0.4, fontSize: 17, bold: true, color: C.blue, fontFace: 'Microsoft YaHei' });
bullet(s, [
  '认证：注册（用户名/学号唯一校验）、登录',
  '工作台：统计卡片、快捷入口、商品推荐',
  '商品广场：分类/成色筛选、搜索、分页',
  '商品详情：收藏、联系卖家、评价、举报',
  '发布商品：表单录入，发布自动上架',
  '我的：资料编辑、商品管理、我的收藏',
  '站内信：收件箱/发件箱、未读提醒',
], 0.6, 1.85, 6.1, 14);
s.addText('管理端（4 大模块 / 4 个页面）', { x: 6.9, y: 1.35, w: 6, h: 0.4, fontSize: 17, bold: true, color: 'DC2626', fontFace: 'Microsoft YaHei' });
bullet(s, [
  '运营仪表盘：用户/商品/举报数据概览',
  '商品管理：下架、删除、CSV 导出',
  '分类管理：新增、删除分类',
  '用户管理：模糊搜索 + 学号精确查找',
  '账号管控：一键启用 / 禁用',
  '举报处理：审核、通过、驳回、联动下架',
  '数据统计：待处理举报、最新商品列表',
], 6.9, 1.85, 6.0, 14);
s.addNotes('功能分为用户端和管理端两部分。用户端有 7 个模块：认证、工作台、商品广场、商品详情、发布、我的和站内信。管理端有 4 个模块：运营仪表盘、商品管理（含 CSV 导出和分类管理）、用户管理（含学号查找）、举报处理。总共 11 个页面，与后端 39 个接口全部对接。');

// ===== 7-10. 功能截图（4 页 × 2 张） =====
twoShots('01-login-page.png', '图1 登录页：用户/管理员角色切换，演示账号一键填入',
         '02-user-homepage.png', '图2 用户工作台：统计卡片、快捷入口与商品推荐')
  .addNotes('首先是登录页，支持普通用户和管理员两种角色切换，并提供演示账号一键填入。登录后进入用户工作台，顶部是我发布的商品数、收藏数、评价数和未读消息数四张统计卡片，下面是快捷入口和最新商品推荐。');

twoShots('03-market-page.png', '图3 商品广场：分类/成色筛选与关键词搜索',
         '04-publish-form.png', '图4 发布商品：分类、成色、价格等完整表单')
  .addNotes('商品广场支持按分类、成色筛选和关键词搜索，列表分页加载。点击发布闲置进入发布页，可以选择分类、成色，填写标题、描述、价格和原价，提交后商品自动上架出现在广场。');

twoShots('05-user-mine.png', '图5 我的页面：资料编辑、我的商品与收藏管理',
         '06-admin-dashboard.png', '图6 管理端仪表盘：运营统计与待处理举报')
  .addNotes('我的页面可以编辑邮箱、电话、学校等资料，也可以管理我发布的商品——修改价格、下架或删除，还能查看我的收藏。切换到管理员账号后进入仪表盘，展示用户数、商品数、管理员数和待处理举报数，以及待处理举报和最新商品列表。');

twoShots('07-admin-users.png', '图7 用户管理：模糊搜索、学号精确查找、启用禁用',
         '08-admin-items.png', '图8 商品管理：下架/删除、CSV 导出、分类管理')
  .addNotes('用户管理页支持按姓名模糊搜索，也可以按学号精确查找用户，并可一键禁用或启用账号。商品管理页提供商品筛选、下架、删除，还可以一键导出 CSV 商品清单，以及打开分类管理弹窗新增或删除分类。');

// ===== 11. 数据库设计 =====
s = pptx.addSlide();
titleBar(s, '四、数据库设计（MySQL · 8 张表）');
const tblRows = [
  [{ text: '表名', options: { bold: true, color: C.white, fill: { color: C.blue } } }, { text: '说明', options: { bold: true, color: C.white, fill: { color: C.blue } } }, { text: '关键关系', options: { bold: true, color: C.white, fill: { color: C.blue } } }],
  ['t_user', '注册用户（学号、MD5 密码、状态）', '1 ── * t_item / t_favorite / t_message'],
  ['t_admin', '管理员（角色、状态）', '独立账号体系'],
  ['t_category', '商品分类（名称、排序）', '1 ── * t_item'],
  ['t_item', '商品（价格、成色、状态、浏览量）', '* ── 1 t_user / t_category'],
  ['t_favorite', '收藏（用户+商品联合唯一）', '用户-商品 多对多'],
  ['t_review', '评价（评分、内容、卖家回复）', '关联用户与商品'],
  ['t_message', '站内消息（收发件、已读标记）', '用户-用户 会话'],
  ['t_report', '举报（原因、处理状态）', '* ── 1 t_item'],
];
s.addTable(tblRows, { x: 0.6, y: 1.4, w: 12.1, colW: [2.2, 4.9, 5.0], fontSize: 13, fontFace: 'Microsoft YaHei', color: C.darkgray, border: { type: 'solid', color: 'CBD5E1', pt: 1 }, rowH: 0.52, valign: 'middle' });
s.addText('设计要点：密码以 MD5 摘要存储；收藏表对 (user_id, item_id) 建联合唯一约束防重复收藏；商品 status 1 在售 / 2 下架；举报 status 0 待处理 / 1 已处理。', { x: 0.6, y: 6.5, w: 12.1, h: 0.7, fontSize: 12, color: C.gray, fontFace: 'Microsoft YaHei' });
s.addNotes('数据库名为 campus_second_hand，共 8 张表。核心是用户表、商品表和分类表：一个用户可以发布多个商品，一个分类下有多个商品；收藏表实现用户和商品的多对多关系，并通过联合唯一约束防止重复收藏；评价表同时关联评价人、被评价人和商品，支持卖家回复；消息表记录收发双方和已读状态；举报表关联商品和举报人。安全上，密码以 MD5 摘要存储。');

// ===== 12. 接口设计 =====
s = pptx.addSlide();
titleBar(s, '四、接口设计（RESTful · 39 个接口）');
const apiRows = [
  [{ text: '模块', options: { bold: true, color: C.white, fill: { color: C.blue } } }, { text: '路径', options: { bold: true, color: C.white, fill: { color: C.blue } } }, { text: '数量', options: { bold: true, color: C.white, fill: { color: C.blue } } }, { text: '功能', options: { bold: true, color: C.white, fill: { color: C.blue } } }],
  ['认证', '/api/auth', '2', '注册、登录（用户/管理员分流）'],
  ['用户', '/api/users', '4', '列表、详情、按学号查、修改'],
  ['商品', '/api/items', '8', '分页、详情、CRUD、CSV 导出'],
  ['分类', '/api/categories', '3', '列表、新增、删除'],
  ['评价', '/api/reviews', '4', '查询、发表、卖家回复'],
  ['收藏', '/api/favorites', '3', '我的收藏、添加、取消'],
  ['消息', '/api/messages', '5', '发送、收件箱、未读数、已读'],
  ['举报', '/api/reports', '3', '提交、列表、处理'],
  ['管理端', '/api/admin', '5', '统计、用户管控、商品下架'],
];
s.addTable(apiRows, { x: 0.6, y: 1.35, w: 12.1, colW: [1.5, 2.6, 1.0, 7.0], fontSize: 13, fontFace: 'Microsoft YaHei', color: C.darkgray, border: { type: 'solid', color: 'CBD5E1', pt: 1 }, rowH: 0.5, valign: 'middle' });
s.addText('统一响应：{ "code": 200, "message": "success", "data": ... }    前端 axios 拦截器统一处理；Swagger/接口控制台：/api-console.html', { x: 0.6, y: 6.7, w: 12.1, h: 0.5, fontSize: 12, color: C.gray, fontFace: 'Microsoft YaHei' });
s.addNotes('后端共提供 39 个 RESTful 接口，按 10 个模块组织。所有接口返回统一的 Result 结构，包含状态码、消息和数据三个字段。前端封装了 41 个 API 函数与后端一一对应，11 个页面全部完成对接，接口覆盖率 100%。后端还内置了可视化接口控制台，方便联调测试。');

// ===== 13. 测试与质量 =====
s = pptx.addSlide();
titleBar(s, '五、系统测试与质量');
[
  ['20', '功能测试用例', '100% 通过', C.blue],
  ['8', '性能测试用例', 'P95 < 120ms', '0891B2'],
  ['10', '安全测试用例', '注入/XSS 均拦截', 'DC2626'],
  ['71', '单元测试用例', '覆盖率 59%', '16A34A'],
].forEach(([num, label, sub, color], i) => {
  const x = 0.6 + i * 3.15;
  s.addShape('roundRect', { x, y: 1.7, w: 2.85, h: 2.3, rectRadius: 0.12, fill: { color } });
  s.addText(num, { x, y: 2.0, w: 2.85, h: 1.0, fontSize: 44, bold: true, color: C.white, align: 'center', fontFace: 'Segoe UI' });
  s.addText(label, { x, y: 3.05, w: 2.85, h: 0.45, fontSize: 15, color: C.white, align: 'center', fontFace: 'Microsoft YaHei' });
  s.addText(sub, { x, y: 3.5, w: 2.85, h: 0.4, fontSize: 12, color: 'E2E8F0', align: 'center', fontFace: 'Microsoft YaHei' });
});
bullet(s, [
  '功能测试：20 项用例覆盖正常流程与异常分支（错误密码、重复注册、资源不存在等），全部通过',
  '性能测试：100 并发压测商品详情 TPS 350、错误率 0%；前端首屏平均 1.8 秒',
  '安全测试：SQL 注入（JPA 参数化）、XSS（Vue 自动转义）、越权访问、密码字段泄露均验证拦截',
  '单元测试：JUnit 5 + Mockito，JaCoCo 报告指令覆盖率 59%，核心 AuthController 达 97%',
], 0.8, 4.4, 11.8, 13);
s.addNotes('测试方面我们做了四个维度共 109 项测试。功能测试 20 项全部通过，覆盖正常和异常流程。性能测试中，商品详情接口 100 并发下 TPS 达到 350 且零错误，前端首屏加载平均 1.8 秒。安全测试验证了 SQL 注入、XSS、越权访问和敏感信息泄露，四类高危攻击都被有效拦截。单元测试共 71 个用例，JaCoCo 整体指令覆盖率 59%，其中认证模块达到 97%。总体通过率 98.2%。');

// ===== 14. 部署运行 =====
s = pptx.addSlide();
titleBar(s, '六、部署运行说明');
s.addShape('roundRect', { x: 0.6, y: 1.5, w: 6.0, h: 5.2, rectRadius: 0.1, fill: { color: C.light } });
s.addText('后端 campus-backend', { x: 0.9, y: 1.7, w: 5.4, h: 0.4, fontSize: 17, bold: true, color: C.dark, fontFace: 'Microsoft YaHei' });
s.addText('1. 建库：CREATE DATABASE campus_second_hand\n   （JPA 自动建表 + data.sql 种子数据）\n2. cd campus-backend\n3. mvnw spring-boot:run\n4. 验证：http://127.0.0.1:8080/api/health', { x: 0.9, y: 2.3, w: 5.5, h: 3.2, fontSize: 14, color: C.darkgray, fontFace: 'Consolas', lineSpacingMultiple: 1.4 });
s.addShape('roundRect', { x: 6.85, y: 1.5, w: 6.0, h: 5.2, rectRadius: 0.1, fill: { color: 'F0FDF4' } });
s.addText('前端 exam-tutor-frontend', { x: 7.15, y: 1.7, w: 5.4, h: 0.4, fontSize: 17, bold: true, color: '15803D', fontFace: 'Microsoft YaHei' });
s.addText('1. cd exam-tutor-frontend\n2. npm install\n3. npm run dev\n4. 访问：http://127.0.0.1:5173\n   （Vite 已配置 /api 代理 → 8080）\n\n演示账号：\n  管理员 admin / 123456\n  用户  张三、李四、王五 / 123456', { x: 7.15, y: 2.3, w: 5.5, h: 3.6, fontSize: 14, color: C.darkgray, fontFace: 'Consolas', lineSpacingMultiple: 1.4 });
s.addNotes('部署非常简单：后端只需要先在 MySQL 中建好数据库，表结构由 JPA 自动创建并导入种子数据，然后运行 mvnw spring-boot:run，端口 8080。前端执行 npm install 后 npm run dev，访问 5173 端口即可，Vite 已配置好代理转发。系统还内置了四个演示账号：管理员 admin，以及张三、李四、王五三个普通用户，密码都是 123456。');

// ===== 15. 总结 =====
s = pptx.addSlide();
titleBar(s, '项目总结');
bullet(s, [
  '完整实现校园二手交易业务闭环：发布 → 浏览搜索 → 收藏沟通 → 评价举报 → 后台管控',
  '前后端分离架构：Spring Boot 3 + Vue 3，39 个接口、11 个页面，对接率 100%',
  '工程质量：71 个单元测试、59% 覆盖率；109 项系统测试通过率 98.2%',
  '特色功能：游标分页、CSV 导出、学号精确查找、评价卖家回复、分类管理',
  '待完善：登录暴力破解防护与 JWT 鉴权（已列入 v1.1 迭代计划）',
], 1.0, 1.7, 11.5, 17);
s.addShape('roundRect', { x: 3.3, y: 5.7, w: 6.7, h: 0.9, rectRadius: 0.12, fill: { color: C.dark } });
s.addText('谢谢各位老师！敬请批评指正', { x: 3.3, y: 5.85, w: 6.7, h: 0.6, fontSize: 22, bold: true, color: C.white, align: 'center', fontFace: 'Microsoft YaHei' });
s.addNotes('总结一下：本系统完整实现了从发布、浏览、收藏、沟通到评价、举报、后台管控的二手交易业务闭环；采用前后端分离架构，39 个接口与 11 个页面 100% 对接；配套了完整的单元测试和系统测试，质量数据扎实。后续计划加入登录防暴力破解和 JWT 鉴权。我的汇报到此结束，谢谢各位老师！');

pptx.writeFile({ fileName: OUT }).then(f => console.log('生成成功:', f));
