// 作业14：系统说明 PPT（精美答辩版）→ pptx
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SRC = 'c:/Users/李恩泽/AppData/Local/Temp/trae/screenshots';
const OUT = 'd:/campus-backend/docs/系统说明PPT.pptx';

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pptx.author = '校园二手交易系统';
pptx.title = '校园二手物品交易系统 - 系统说明';

// ===== 配色 =====
const C = {
  navy:   '0F2A5E',  // 深海军蓝（主色）
  blue:   '2563EB',  // 品牌蓝
  sky:    '3B82F6',
  light:  'EFF6FF',  // 浅蓝卡片底
  lighter:'F8FAFC',
  green:  '16A34A',
  greenBg:'F0FDF4',
  red:    'DC2626',
  redBg:  'FEF2F2',
  amber:  'D97706',
  amberBg:'FFFBEB',
  gray:   '64748B',
  dark:   '1E293B',
  line:   'CBD5E1',
  white:  'FFFFFF',
};
const FONT = 'Microsoft YaHei';
const W = 13.33, H = 7.5;
let pageNo = 0;

// ===== 通用组件 =====
function footer(slide) {
  slide.addText('校园二手物品交易系统', { x: 0.5, y: 7.12, w: 4, h: 0.3, fontSize: 9, color: C.gray, fontFace: FONT });
  pageNo++;
  slide.addText(String(pageNo), { x: 12.5, y: 7.12, w: 0.5, h: 0.3, fontSize: 9, color: C.gray, align: 'right', fontFace: FONT });
}

function header(slide, kicker, title) {
  // 顶部色带
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 1.15, fill: { color: C.navy } });
  slide.addShape('rect', { x: 0, y: 1.15, w: W, h: 0.06, fill: { color: C.sky } });
  // 左侧装饰条
  slide.addShape('rect', { x: 0.5, y: 0.32, w: 0.12, h: 0.55, fill: { color: '60A5FA' } });
  slide.addText(kicker, { x: 0.78, y: 0.22, w: 8, h: 0.3, fontSize: 11, color: '93C5FD', fontFace: FONT, charSpacing: 2 });
  slide.addText(title, { x: 0.76, y: 0.5, w: 11.5, h: 0.55, fontSize: 24, bold: true, color: C.white, fontFace: FONT });
}

function bullets(slide, items, x, y, w, opts = {}) {
  const size = opts.size || 14.5;
  const gap = opts.gap || 0.42;
  items.forEach((t, i) => {
    const yy = y + i * gap * (opts.loose ? 1.5 : 1);
    slide.addShape('ellipse', { x, y: yy + 0.08, w: 0.1, h: 0.1, fill: { color: opts.dotColor || C.sky } });
    slide.addText(t, { x: x + 0.25, y: yy - 0.06, w: w - 0.25, h: gap * 1.6, fontSize: size, color: opts.color || C.dark, fontFace: FONT, lineSpacingMultiple: 1.25, valign: 'top' });
  });
}

function card(slide, x, y, w, h, fill, line) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.1, fill: { color: fill || C.white }, line: line ? { color: line, width: 1 } : undefined, shadow: { type: 'outer', color: '94A3B8', blur: 6, offset: 2, angle: 90, opacity: 0.25 } });
}

// 章节过渡页
function divider(num, title, subtitle, points) {
  const s = pptx.addSlide();
  s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
  // 右侧大圆装饰
  s.addShape('ellipse', { x: 9.6, y: -2.2, w: 6.5, h: 6.5, fill: { color: '16366F' } });
  s.addShape('ellipse', { x: 11.2, y: 4.4, w: 4.2, h: 4.2, fill: { color: '16366F' } });
  s.addShape('rect', { x: 0.9, y: 2.5, w: 0.14, h: 2.2, fill: { color: C.sky } });
  s.addText('PART ' + num, { x: 1.3, y: 2.35, w: 6, h: 0.5, fontSize: 16, color: '60A5FA', fontFace: 'Segoe UI', charSpacing: 4, bold: true });
  s.addText(title, { x: 1.25, y: 2.85, w: 10, h: 1.0, fontSize: 40, bold: true, color: C.white, fontFace: FONT });
  s.addText(subtitle, { x: 1.3, y: 3.95, w: 10.5, h: 0.5, fontSize: 16, color: '93C5FD', fontFace: FONT });
  if (points) {
    const arr = Array.isArray(points) ? points : [points];
    s.addText(arr.map(t => ({ text: t, options: { breakLine: true } })), { x: 1.3, y: 4.7, w: 10.5, h: 1.2, fontSize: 13, color: 'BFDBFE', fontFace: FONT, lineSpacingMultiple: 1.5 });
  }
  s.addNotes('接下来进入第 ' + num + ' 部分：' + title + '。' + (subtitle || ''));
  return s;
}

// 内容页骨架
function contentPage(kicker, title) {
  const s = pptx.addSlide();
  header(s, kicker, title);
  footer(s);
  return s;
}

// 截图详情页（左大图 + 右要点）
function shotPage(kicker, title, imgFile, points, note) {
  const s = contentPage(kicker, title);
  const fp = path.join(SRC, imgFile);
  const { w: pw, h: ph } = pngSize(fp);
  // 左侧截图区
  card(s, 0.45, 1.5, 8.35, 5.35, C.lighter, C.line);
  const maxW = 8.0, maxH = 4.95;
  let w = maxW, h = w * ph / pw;
  if (h > maxH) { h = maxH; w = h * pw / ph; }
  s.addImage({ path: fp, x: 0.62 + (maxW - w) / 2, y: 1.68 + (maxH - h) / 2, w, h });
  // 右侧要点区
  card(s, 9.0, 1.5, 3.9, 5.35, C.light);
  s.addShape('rect', { x: 9.0, y: 1.5, w: 3.9, h: 0.55, fill: { color: C.blue } });
  s.addText('功能要点', { x: 9.25, y: 1.56, w: 3.4, h: 0.42, fontSize: 15, bold: true, color: C.white, fontFace: FONT });
  bullets(s, points, 9.25, 2.28, 3.45, { size: 12.5, gap: 0.6, loose: true });
  s.addNotes(note);
  return s;
}

// ============================================================
// 1. 封面
// ============================================================
let s = pptx.addSlide();
s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
s.addShape('ellipse', { x: 8.8, y: -2.8, w: 7, h: 7, fill: { color: '16366F' } });
s.addShape('ellipse', { x: -2.2, y: 4.6, w: 5.5, h: 5.5, fill: { color: '16366F' } });
s.addShape('rect', { x: 1.2, y: 1.7, w: 1.4, h: 0.12, fill: { color: C.sky } });
s.addText('课程设计项目答辩', { x: 1.2, y: 1.95, w: 8, h: 0.5, fontSize: 18, color: '93C5FD', fontFace: FONT, charSpacing: 3 });
s.addText('校园二手物品交易系统', { x: 1.15, y: 2.6, w: 11, h: 1.1, fontSize: 48, bold: true, color: C.white, fontFace: FONT });
s.addText('Campus Second-hand Trading System', { x: 1.2, y: 3.85, w: 11, h: 0.5, fontSize: 17, color: '7FB0F5', fontFace: 'Segoe UI', italic: true });
// 技术栈标签
const tags = ['Spring Boot 3', 'Vue 3', 'MySQL 8.0', 'JPA', 'Element Plus', 'RESTful API'];
tags.forEach((t, i) => {
  const x = 1.2 + (i % 3) * 2.5, y = 4.85 + Math.floor(i / 3) * 0.62;
  s.addShape('roundRect', { x, y, w: 2.3, h: 0.48, rectRadius: 0.24, fill: { color: '1D4ED8' } });
  s.addText(t, { x, y: y + 0.07, w: 2.3, h: 0.36, fontSize: 13, color: C.white, align: 'center', fontFace: FONT });
});
s.addText('汇报人：（班级 + 组号 + 姓名）        2026 年 9 月', { x: 1.2, y: 6.5, w: 10.9, h: 0.4, fontSize: 14, color: 'BFDBFE', fontFace: FONT });
s.addNotes('各位老师好！我们小组的课程设计题目是《校园二手物品交易系统》。这是一个面向在校师生的闲置物品交易平台，采用 Spring Boot 加 Vue 3 的前后端分离架构。下面我将从项目概述、技术架构、功能演示、数据库设计、测试质量以及部署总结六个部分进行汇报。');

// ============================================================
// 2. 目录
// ============================================================
s = contentPage('CONTENTS', '汇报目录');
const toc = [
  ['01', '项目概述', '项目背景、建设目标与系统角色', C.blue],
  ['02', '技术架构', '技术选型、系统架构与工程结构', '0891B2'],
  ['03', '功能展示', '用户端与管理端功能界面演示', C.sky],
  ['04', '数据库与接口', '数据表设计与 RESTful 接口', C.amber],
  ['05', '测试与质量', '功能/性能/安全/单元测试', C.green],
  ['06', '部署与总结', '运行部署说明与项目总结', C.red],
];
toc.forEach(([num, t, d, color], i) => {
  const col = i < 3 ? 0 : 1, row = i % 3;
  const x = 0.7 + col * 6.35, y = 1.7 + row * 1.75;
  card(s, x, y, 6.0, 1.5, C.lighter, C.line);
  s.addShape('roundRect', { x: x + 0.25, y: y + 0.28, w: 0.95, h: 0.95, rectRadius: 0.1, fill: { color } });
  s.addText(num, { x: x + 0.25, y: y + 0.42, w: 0.95, h: 0.7, fontSize: 26, bold: true, color: C.white, align: 'center', fontFace: 'Segoe UI' });
  s.addText(t, { x: x + 1.45, y: y + 0.3, w: 4.3, h: 0.5, fontSize: 19, bold: true, color: C.navy, fontFace: FONT });
  s.addText(d, { x: x + 1.45, y: y + 0.85, w: 4.4, h: 0.4, fontSize: 12.5, color: C.gray, fontFace: FONT });
});
s.addNotes('本次汇报共分六个部分：第一部分介绍项目背景、目标和系统角色；第二部分讲解技术选型和系统架构；第三部分是重点，进行用户端和管理端的功能界面演示；第四部分介绍数据库和接口设计；第五部分汇报测试与质量情况；最后是部署说明和项目总结。');

// ============================================================
// PART 01 项目概述
// ============================================================
divider('01', '项目概述', 'Project Overview', '· 项目背景与痛点    · 建设目标    · 系统角色分析');

// 4. 项目背景
s = contentPage('PART 01  项目概述', '项目背景与痛点分析');
card(s, 0.55, 1.55, 5.9, 5.2, C.amberBg);
s.addText('现实痛点', { x: 0.85, y: 1.8, w: 5, h: 0.45, fontSize: 18, bold: true, color: C.amber, fontFace: FONT });
bullets(s, [
  '高校每年毕业季、开学季产生大量闲置物品：教材、电子产品、生活用品',
  '线下跳蚤市场时间固定、地点受限，信息传播范围小',
  '大型社会二手平台面向全社会，缺少校园场景的信任感',
  '买卖双方沟通不便，商品成色、价格缺乏透明对比',
  '闲置资源浪费，学生买卖需求长期得不到高效匹配',
], 0.85, 2.45, 5.4, { size: 13.5, gap: 0.72, loose: true, dotColor: C.amber });
card(s, 6.85, 1.55, 5.9, 5.2, C.greenBg);
s.addText('解决思路', { x: 7.15, y: 1.8, w: 5, h: 0.45, fontSize: 18, bold: true, color: C.green, fontFace: FONT });
bullets(s, [
  '搭建校园专属线上二手交易平台，学号注册确保用户身份真实',
  '分类浏览 + 关键词搜索 + 成色筛选，快速找到目标商品',
  '站内消息直接沟通，交易后互评建立信用体系',
  '举报 + 管理员审核机制，保障平台交易安全',
  '线上 7×24 小时可用，打破时间地点限制',
], 7.15, 2.45, 5.4, { size: 13.5, gap: 0.72, loose: true, dotColor: C.green });
s.addNotes('首先看项目背景。高校里每到毕业季和开学季，都会产生大量闲置物品。但传统线下跳蚤市场时间固定、信息传播有限，而社会二手平台又缺少校园内部的信任感。针对这些痛点，我们的解决思路是搭建一个校园专属的线上交易平台：用学号注册保证用户真实身份，用分类搜索提高匹配效率，用站内消息和评价体系建立信任，再加上举报和管理员审核机制保障安全。');

// 5. 建设目标
s = contentPage('PART 01  项目概述', '项目建设目标');
const goals = [
  ['便捷交易', '学生可随时随地发布、浏览、搜索二手商品，收藏心仪物品并与卖家沟通', C.blue, C.light],
  ['交易闭环', '发布 → 浏览 → 收藏沟通 → 成交评价 → 违规举报，完整业务链路', C.green, C.greenBg],
  ['后台管控', '管理员进行用户管理、商品下架、分类维护、举报处理与运营统计', C.amber, C.amberBg],
  ['技术实践', '实践前后端分离架构、RESTful API、JPA 数据持久化与自动化测试', C.red, C.redBg],
];
goals.forEach(([t, d, color, bg], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.7 + col * 6.2, y = 1.7 + row * 2.45;
  card(s, x, y, 5.85, 2.15, bg);
  s.addShape('rect', { x, y, w: 0.14, h: 2.15, fill: { color } });
  s.addText(String(i + 1).padStart(2, '0'), { x: x + 0.35, y: y + 0.25, w: 1.2, h: 0.8, fontSize: 34, bold: true, color, fontFace: 'Segoe UI' });
  s.addText(t, { x: x + 1.6, y: y + 0.35, w: 4, h: 0.5, fontSize: 20, bold: true, color: C.navy, fontFace: FONT });
  s.addText(d, { x: x + 1.6, y: y + 0.95, w: 4.05, h: 1.0, fontSize: 13, color: C.dark, fontFace: FONT, lineSpacingMultiple: 1.3 });
});
s.addNotes('项目建设目标有四个：第一是便捷交易，让学生随时随地发布和浏览二手商品；第二是形成交易闭环，从发布、浏览、沟通到评价、举报，链路完整；第三是后台管控，管理员可以管理用户、商品、分类和举报；第四是技术目标，实践前后端分离、RESTful 接口、JPA 持久化和自动化测试等主流技术。');

// 6. 系统角色
s = contentPage('PART 01  项目概述', '系统角色与权限');
card(s, 0.7, 1.6, 5.75, 5.1, C.light, C.blue);
s.addShape('rect', { x: 0.7, y: 1.6, w: 5.75, h: 0.7, fill: { color: C.blue } });
s.addText('👤  普通用户（买家 / 卖家）', { x: 1.0, y: 1.72, w: 5.2, h: 0.5, fontSize: 17, bold: true, color: C.white, fontFace: FONT });
bullets(s, [
  '学号 + 用户名注册，个人资料维护',
  '发布商品（分类、成色、价格、描述）',
  '浏览广场：分类/成色筛选、关键词搜索',
  '收藏商品、站内信联系卖家',
  '交易后发表评价、查看卖家回复',
  '发现违规商品可一键举报',
], 1.0, 2.55, 5.2, { size: 13, gap: 0.62, loose: false });
card(s, 6.9, 1.6, 5.75, 5.1, C.redBg, C.red);
s.addShape('rect', { x: 6.9, y: 1.6, w: 5.75, h: 0.7, fill: { color: C.red } });
s.addText('🛡  管理员', { x: 7.2, y: 1.72, w: 5.2, h: 0.5, fontSize: 17, bold: true, color: C.white, fontFace: FONT });
bullets(s, [
  '运营仪表盘：用户/商品/举报数据统计',
  '用户管理：模糊搜索、按学号精确查找',
  '账号管控：一键启用 / 禁用违规用户',
  '商品管理：下架、删除、CSV 数据导出',
  '分类管理：新增、删除商品分类',
  '举报处理：审核举报并联动下架商品',
], 7.2, 2.55, 5.2, { size: 13, gap: 0.62, loose: false, dotColor: C.red });
s.addNotes('系统有两类角色。普通用户通过学号注册，可以发布商品、浏览搜索、收藏、发消息、评价和举报。管理员负责平台运营，包括查看统计数据、按学号查找用户、禁用违规账号、下架商品、导出 CSV、维护分类和处理举报。两类角色登录入口分离，权限由前端路由守卫和后端接口共同保障。');

// ============================================================
// PART 02 技术架构
// ============================================================
divider('02', '技术架构', 'Technical Architecture', '· 技术选型    · 三层架构    · 工程结构');

// 8. 技术栈
s = contentPage('PART 02  技术架构', '技术选型');
const stack = [
  ['前端框架', 'Vue 3', '组合式 API，响应式单页应用', C.blue],
  ['构建工具', 'Vite 6', '秒级热更新，开发代理配置', C.sky],
  ['UI 组件库', 'Element Plus', '表格/表单/弹窗等成熟组件', C.green],
  ['HTTP 库', 'Axios', '请求封装与统一响应拦截', C.amber],
  ['后端框架', 'Spring Boot 3.4.5', '自动装配，内嵌 Tomcat', C.red],
  ['持久层', 'Spring Data JPA', 'Hibernate ORM，方法名派生查询', '7C3AED'],
  ['数据库', 'MySQL 8.0', 'InnoDB 引擎，utf8mb4 字符集', '0891B2'],
  ['测试体系', 'JUnit5 + Mockito + JaCoCo', '单元测试与覆盖率分析', '0D9488'],
];
stack.forEach(([t, name, d, color], i) => {
  const col = i % 4, row = Math.floor(i / 4);
  const x = 0.55 + col * 3.12, y = 1.65 + row * 2.55;
  card(s, x, y, 2.95, 2.3, C.white, C.line);
  s.addShape('roundRect', { x: x + 1.02, y: y + 0.25, w: 0.9, h: 0.9, rectRadius: 0.12, fill: { color } });
  s.addText(t.charAt(0), { x: x + 1.02, y: y + 0.4, w: 0.9, h: 0.6, fontSize: 26, bold: true, color: C.white, align: 'center', fontFace: FONT });
  s.addText(t, { x, y: y + 1.25, w: 2.95, h: 0.35, fontSize: 13, color: C.gray, align: 'center', fontFace: FONT });
  s.addText(name, { x, y: y + 1.58, w: 2.95, h: 0.35, fontSize: 15, bold: true, color: C.navy, align: 'center', fontFace: FONT });
  s.addText(d, { x: x + 0.15, y: y + 1.92, w: 2.65, h: 0.4, fontSize: 10.5, color: C.gray, align: 'center', fontFace: FONT });
});
s.addNotes('技术选型方面：前端使用 Vue 3 组合式 API，配合 Vite 构建工具实现秒级热更新，UI 使用 Element Plus 组件库，HTTP 请求用 Axios 并做了统一拦截封装。后端使用 Spring Boot 3.4.5，持久层采用 Spring Data JPA，数据库是 MySQL 8.0。测试体系采用 JUnit 5、Mockito 和 JaCoCo。整个技术栈都是当前企业开发的主流选择。');

// 9. 系统架构图
s = contentPage('PART 02  技术架构', '系统三层架构');
// 三个大盒子
const boxes = [
  [0.55, '表现层（前端）', 'Vue 3 SPA · Element Plus', ['11 个页面视图', '41 个 API 函数封装', 'Vue Router 角色守卫', 'Axios 拦截器统一处理'], 'DBEAFE', C.blue],
  [4.78, '应用层（后端）', 'Spring Boot · :8080', ['10 个 Controller', '39 个 RESTful 接口', '9 个 JPA Repository', '统一 Result 响应结构'], 'BFDBFE', '1D4ED8'],
  [9.0, '数据层', 'MySQL 8.0', ['8 张业务数据表', 'JPA 自动建表', 'HikariCP 连接池', 'MD5 密码摘要存储'], '93C5FD', '0F2A5E'],
];
boxes.forEach(([x, title, sub, items, fill, bar]) => {
  card(s, x, 1.7, 3.85, 3.9, fill);
  s.addShape('rect', { x, y: 1.7, w: 3.85, h: 0.75, fill: { color: bar } });
  s.addText(title, { x, y: 1.8, w: 3.85, h: 0.4, fontSize: 16, bold: true, color: C.white, align: 'center', fontFace: FONT });
  s.addText(sub, { x, y: 2.15, w: 3.85, h: 0.3, fontSize: 11, color: 'E0E7FF', align: 'center', fontFace: FONT });
  bullets(s, items, x + 0.35, 2.8, 3.2, { size: 12.5, gap: 0.55, loose: true, dotColor: bar });
});
// 箭头
s.addText('HTTP / JSON （Vite 代理 /api → :8080）', { x: 3.95, y: 3.35, w: 1.6, h: 0.6, fontSize: 10.5, color: C.gray, align: 'center', fontFace: FONT });
s.addText('JPA / Hibernate （SQL）', { x: 8.1, y: 3.35, w: 1.6, h: 0.6, fontSize: 10.5, color: C.gray, align: 'center', fontFace: FONT });
card(s, 1.6, 5.9, 10.1, 0.85, C.lighter, C.line);
s.addText('统一响应规范：{ "code": 200, "message": "success", "data": {...} }    ——    code=200 成功 / 404 资源不存在 / 500 业务错误', { x: 1.8, y: 6.1, w: 9.7, h: 0.5, fontSize: 13, color: C.navy, align: 'center', fontFace: 'Consolas' });
s.addNotes('系统采用经典三层架构。表现层是 Vue 3 单页应用，包含 11 个页面和 41 个 API 封装函数，通过路由守卫区分用户和管理员。应用层是 Spring Boot 后端，包含 10 个 Controller 共 39 个 REST 接口，使用 9 个 JPA Repository 操作数据库。数据层是 MySQL，共 8 张表，由 JPA 自动建表。前后端通过 HTTP JSON 通信，所有响应统一包装为 Result 结构，前端开发时由 Vite 代理解决跨域。');

// 10. 工程结构
s = contentPage('PART 02  技术架构', '工程结构');
card(s, 0.6, 1.6, 6.0, 5.2, C.lighter);
s.addText('后端 campus-backend', { x: 0.9, y: 1.85, w: 5, h: 0.4, fontSize: 16, bold: true, color: C.blue, fontFace: FONT });
s.addText(
`src/main/java/com/campus/
├── controller/      10 个控制器（接口层）
├── entity/          9 个 JPA 实体类
├── repository/      9 个数据访问接口
├── dto/             登录/注册请求对象
├── common/          Result 统一响应封装
└── util/            Md5Util 密码加密
src/main/resources/
├── application.properties   数据源配置
└── data.sql                 种子演示数据
src/test/                     10 个测试类 / 71 用例
pom.xml                       Maven 依赖 + JaCoCo 插件`,
{ x: 0.9, y: 2.35, w: 5.5, h: 4.2, fontSize: 12.5, color: C.dark, fontFace: 'Consolas', lineSpacingMultiple: 1.35 });
card(s, 6.9, 1.6, 5.9, 5.2, C.greenBg);
s.addText('前端 exam-tutor-frontend', { x: 7.2, y: 1.85, w: 5, h: 0.4, fontSize: 16, bold: true, color: C.green, fontFace: FONT });
s.addText(
`src/
├── api/index.js     41 个 API 函数（9 大模块）
├── views/
│   ├── user/        7 个用户端页面
│   │   ├── HomeView      工作台
│   │   ├── MarketView    商品广场
│   │   ├── ItemDetail    商品详情
│   │   ├── PublishView   发布商品
│   │   └── ...
│   └── admin/       4 个管理端页面
│       ├── Dashboard     仪表盘
│       ├── ItemsView     商品管理
│       └── ...
├── router/          路由 + 角色守卫
└── main.js          应用入口
vite.config.js     /api 代理 → 127.0.0.1:8080`,
{ x: 7.2, y: 2.35, w: 5.4, h: 4.2, fontSize: 12.5, color: C.dark, fontFace: 'Consolas', lineSpacingMultiple: 1.35 });
s.addNotes('工程结构清晰：后端按标准 Spring Boot 分层，controller 是接口层，entity 是 JPA 实体，repository 是数据访问层，common 里放统一响应封装，测试代码 10 个类 71 个用例。前端按功能组织，api 目录集中管理 41 个接口函数，views 分为用户端 7 个页面和管理端 4 个页面，router 里配置了角色守卫，vite 配置文件把 /api 请求代理到后端 8080 端口。');

// ============================================================
// PART 03 功能展示
// ============================================================
divider('03', '功能展示', 'Function Demonstration', '· 用户端 7 大模块    · 管理端 4 大模块    · 真实系统界面演示');

// 12. 用户端功能总览
s = contentPage('PART 03  功能展示', '用户端功能全景');
const userMods = [
  ['🔐', '认证模块', '注册（用户名/学号唯一校验）、登录（用户/管理员分流）、禁用账号拦截'],
  ['🏠', '工作台', '我的发布/收藏/评价/未读消息统计卡片、快捷入口、最新商品推荐'],
  ['🛍', '商品广场', '分类筛选、成色筛选、关键词搜索、游标分页无限加载'],
  ['📦', '商品详情', '商品信息、浏览量+1、收藏、联系卖家、评价列表、卖家回复、举报'],
  ['✏️', '发布商品', '分类下拉、成色选择、价格/原价录入，提交自动上架'],
  ['👤', '我的', '资料编辑（邮箱/电话/学校/头像）、商品改价/下架/删除、我的收藏'],
  ['💬', '站内信', '收件箱/发件箱、未读消息角标、一键标记已读、按商品关联会话'],
];
userMods.forEach(([icon, t, d], i) => {
  const y = 1.55 + i * 0.76;
  card(s, 0.7, y, 12.0, 0.66, i % 2 === 0 ? C.lighter : C.light);
  s.addText(icon, { x: 0.9, y: y + 0.08, w: 0.6, h: 0.5, fontSize: 20, align: 'center' });
  s.addText(t, { x: 1.6, y: y + 0.12, w: 1.8, h: 0.42, fontSize: 15, bold: true, color: C.navy, fontFace: FONT });
  s.addText(d, { x: 3.5, y: y + 0.13, w: 9.0, h: 0.42, fontSize: 12.5, color: C.dark, fontFace: FONT });
});
s.addNotes('用户端共 7 大功能模块：认证模块支持注册登录，注册时校验用户名和学号唯一；工作台展示四类统计卡片和商品推荐；商品广场支持分类、成色筛选和关键词搜索；商品详情页集成收藏、联系卖家、评价、回复和举报；发布页表单完整，提交后自动上架；我的页面可以编辑资料和管理自己的商品；站内信支持收发件箱和未读提醒。下面逐页演示。');

// 13-17. 用户端截图页
shotPage('PART 03  功能展示 · 用户端', '登录与注册',
  '01-login-page.png',
  ['用户 / 管理员双角色切换', '演示账号一键填入', '登录失败友好提示', '禁用账号登录拦截', '路由守卫自动跳转'],
  '首先是登录页面。页面顶部可以切换普通用户和管理员两种角色，下方提供演示账号一键填入功能。登录时后端校验密码 MD5 摘要，密码错误或账号被禁用都会给出明确提示；前端路由守卫会阻止未登录用户访问内部页面。');

shotPage('PART 03  功能展示 · 用户端', '用户工作台',
  '02-user-homepage.png',
  ['发布/收藏/评价/未读 4 张统计卡片', '快捷入口一键直达', '最新商品卡片推荐', '未读消息实时角标', '个性化数据概览'],
  '登录成功后进入用户工作台。顶部是四张统计卡片，分别显示我发布的商品数、收藏数、收到的评价数和未读消息数；中间是发布闲置、商品广场等快捷入口；下方是最新商品推荐流。所有数据在进入页面时并发请求后端接口实时加载。');

shotPage('PART 03  功能展示 · 用户端', '商品广场',
  '03-market-page.png',
  ['按商品分类筛选', '按成色（全新/九成新等）筛选', '标题关键词模糊搜索', '游标分页滚动加载', '卡片展示价格与成色'],
  '商品广场是买家最常用的页面。左侧支持按教材书籍、电子产品等分类筛选，也可以按成色过滤；顶部搜索框支持标题关键词模糊搜索。列表采用游标分页，滚动到底部自动加载下一页，商品卡片上清晰展示价格、原价和成色标签。');

shotPage('PART 03  功能展示 · 用户端', '发布商品',
  '04-publish-form.png',
  ['分类下拉动态加载', '成色五档选择', '售价 / 原价录入', '表单校验与提示', '提交后自动上架（status=1）'],
  '点击发布闲置进入发布页面。分类下拉框从后端动态加载，成色提供五档选择，价格和原价都有表单校验。提交时后端自动将商品状态设为在售，发布成功后商品立即出现在商品广场和个人商品列表中。');

shotPage('PART 03  功能展示 · 用户端', '我的页面',
  '05-user-mine.png',
  ['头像 / 邮箱 / 电话 / 学校编辑', '我发布的商品列表', '商品改价、下架、删除', '我的收藏集中管理', '收藏数 / 评价数展示'],
  '我的页面集中管理个人信息和商品。上半部分可以编辑头像、邮箱、电话和学校；下半部分是我发布的商品列表，可以对商品改价、下架或删除；还能查看我的收藏。页面同时展示收藏数和收到的评价数。');

// 18. 管理端功能总览
s = contentPage('PART 03  功能展示', '管理端功能全景');
const adminMods = [
  ['📊', '运营仪表盘', '用户数 / 商品数 / 管理员数 / 待处理举报数四大指标，最新商品与待办列表'],
  ['📦', '商品管理', '商品列表筛选搜索、修改、删除、强制下架、一键导出 CSV 清单'],
  ['📁', '分类管理', '弹窗式分类列表，支持新增分类与删除分类，即时生效'],
  ['👥', '用户管理', '模糊搜索 + 按学号精确查找，账号一键启用 / 禁用'],
  ['🚩', '举报处理', '举报列表按状态筛选，审核通过/驳回，可联动下架违规商品'],
];
adminMods.forEach(([icon, t, d], i) => {
  const y = 1.65 + i * 1.02;
  card(s, 0.7, y, 12.0, 0.88, C.redBg);
  s.addShape('rect', { x: 0.7, y, w: 0.14, h: 0.88, fill: { color: C.red } });
  s.addText(icon, { x: 1.0, y: y + 0.16, w: 0.6, h: 0.55, fontSize: 22, align: 'center' });
  s.addText(t, { x: 1.75, y: y + 0.13, w: 2.2, h: 0.5, fontSize: 17, bold: true, color: C.navy, fontFace: FONT });
  s.addText(d, { x: 4.1, y: y + 0.16, w: 8.3, h: 0.6, fontSize: 13, color: C.dark, fontFace: FONT, valign: 'middle' });
});
s.addNotes('管理端共 4 大模块：运营仪表盘展示用户数、商品数、管理员数和待处理举报数；商品管理支持下架、删除和 CSV 导出；分类管理用弹窗实现新增和删除；用户管理支持模糊搜索和学号精确查找，可以禁用违规账号；举报处理支持审核并联动下架商品。下面逐页演示。');

// 19-21. 管理端截图页
shotPage('PART 03  功能展示 · 管理端', '运营仪表盘',
  '06-admin-dashboard.png',
  ['用户 / 商品 / 管理员 / 举报 四项统计', '待处理举报快捷列表', '最新发布商品动态', '数据实时聚合计算', '管理员待办一目了然'],
  '管理员登录后进入运营仪表盘。顶部四张卡片实时统计用户总数、商品总数、管理员数和待处理举报数；下方左侧是待处理举报列表，可以直接跳转处理；右侧是最新发布的商品动态，方便管理员快速掌握平台运营状况。');

shotPage('PART 03  功能展示 · 管理端', '用户管理',
  '07-admin-users.png',
  ['全部注册用户列表', '姓名 / 学号 / 学校展示', '关键词模糊搜索', '按学号精确查找用户', '账号状态切换（启用/禁用）'],
  '用户管理页展示全部注册用户。顶部支持关键词模糊搜索，还专门提供了按学号精确查找的输入框——这是为校园场景设计的功能，管理员输入学号即可定位特定学生。每行可以切换账号状态，被禁用的用户将无法登录，前端列表即时刷新。');

shotPage('PART 03  功能展示 · 管理端', '商品管理',
  '08-admin-items.png',
  ['商品多条件筛选与搜索', '商品信息修改与删除', '违规商品强制下架', '一键导出 CSV 报表', '分类管理弹窗（增/删）'],
  '商品管理页是管理端功能最丰富的页面：支持多条件筛选搜索，可以修改或删除商品，对违规商品可以强制下架；点击导出 CSV 按钮会下载包含全部商品信息的表格文件；点击分类管理可以在弹窗中新增或删除商品分类。这些功能在本次开发中均已完成联调验证。');

// ============================================================
// PART 04 数据库与接口
// ============================================================
divider('04', '数据库与接口', 'Database & API Design', '· 8 张数据表    · ER 关系    · 39 个 RESTful 接口');

// 23. 数据库设计
s = contentPage('PART 04  数据库与接口', '数据库表设计（MySQL · 8 张表）');
const dbRows = [
  [{ text: '表名', options: { bold: true, color: C.white, fill: { color: C.navy } } },
   { text: '说明', options: { bold: true, color: C.white, fill: { color: C.navy } } },
   { text: '关键字段 / 约束', options: { bold: true, color: C.white, fill: { color: C.navy } } }],
  ['t_user', '注册用户', 'username 唯一、student_id 唯一、password 存 MD5、status 状态位'],
  ['t_admin', '管理员', '独立账号体系、role 角色、status 状态'],
  ['t_category', '商品分类', 'name 分类名、sort_order 排序'],
  ['t_item', '商品', 'user_id/category_id 外键、price 价格、condition_level 成色、status(1在售/2下架)、view_count'],
  ['t_favorite', '收藏', '(user_id, item_id) 联合唯一约束，防止重复收藏'],
  ['t_review', '评价', 'reviewer_id 评价人、target_user_id 被评价人、rating(1~5)、reply 卖家回复'],
  ['t_message', '站内消息', 'sender_id/receiver_id 收发件人、item_id 关联商品、is_read 已读标记'],
  ['t_report', '举报', 'reporter_id 举报人、item_id 关联商品、status(0待处理/1已处理)'],
];
s.addTable(dbRows, { x: 0.55, y: 1.5, w: 12.25, colW: [1.9, 1.9, 8.45], fontSize: 12.5, fontFace: FONT, color: C.dark, border: { type: 'solid', color: C.line, pt: 1 }, rowH: 0.56, valign: 'middle' });
s.addText('设计要点：JPA ddl-auto=update 自动建表，data.sql 初始化 3 名用户、1 名管理员、6 个分类与演示商品数据。', { x: 0.55, y: 6.65, w: 12, h: 0.4, fontSize: 12, color: C.gray, fontFace: FONT });
s.addNotes('数据库名为 campus_second_hand，共 8 张表。用户表对用户名和学号建唯一约束，密码存 MD5 摘要；商品表通过外键关联用户和分类，status 字段标记在售或下架，view_count 记录浏览量；收藏表对用户和商品建联合唯一约束，从数据库层面防止重复收藏；评价表同时关联评价人和被评价人，支持卖家回复；消息表记录收发双方和已读状态。表结构由 JPA 自动创建，种子数据由 data.sql 初始化。');

// 24. ER 关系
s = contentPage('PART 04  数据库与接口', '实体关系（ER）');
const rels = [
  ['t_user', '1 ─── *', 't_item', '一个用户发布多个商品'],
  ['t_category', '1 ─── *', 't_item', '一个分类包含多个商品'],
  ['t_user', '* ─── *', 't_item', '收藏关系（t_favorite 中间表）'],
  ['t_user', '1 ─── *', 't_review', '评价人 / 被评价人双外键'],
  ['t_item', '1 ─── *', 't_review', '一个商品可有多条评价'],
  ['t_user', '1 ─── *', 't_message', '发件人 / 收件人双向关联'],
  ['t_item', '1 ─── *', 't_report', '一个商品可被多次举报'],
];
rels.forEach(([a, sym, b, d], i) => {
  const y = 1.65 + i * 0.72;
  card(s, 1.2, y, 2.3, 0.58, C.light);
  card(s, 8.0, y, 2.3, 0.58, C.light);
  s.addText(a, { x: 1.2, y: y + 0.1, w: 2.3, h: 0.4, fontSize: 14, bold: true, color: C.navy, align: 'center', fontFace: 'Consolas' });
  s.addText(b, { x: 8.0, y: y + 0.1, w: 2.3, h: 0.4, fontSize: 14, bold: true, color: C.navy, align: 'center', fontFace: 'Consolas' });
  s.addText(sym, { x: 3.7, y: y + 0.08, w: 4.1, h: 0.42, fontSize: 17, bold: true, color: C.red, align: 'center', fontFace: 'Segoe UI' });
  s.addText(d, { x: 10.5, y: y + 0.12, w: 2.6, h: 0.4, fontSize: 11.5, color: C.gray, fontFace: FONT });
});
s.addNotes('实体关系方面：用户和商品是一对多关系，一个用户可以发布多个商品；分类和商品也是一对多；用户和商品之间通过收藏表形成多对多关系；评价表关联用户和商品，一个商品可以有多条评价；消息表在用户之间形成双向关联；举报表关联商品，一个商品可以被多次举报。所有关系通过外键和 JPA 关联映射维护。');

// 25. 接口设计
s = contentPage('PART 04  数据库与接口', 'RESTful 接口设计（39 个接口）');
const apiRows = [
  [{ text: '模块', options: { bold: true, color: C.white, fill: { color: C.navy } } },
   { text: '路径前缀', options: { bold: true, color: C.white, fill: { color: C.navy } } },
   { text: '数量', options: { bold: true, color: C.white, fill: { color: C.navy } } },
   { text: '主要功能', options: { bold: true, color: C.white, fill: { color: C.navy } } }],
  ['认证', '/api/auth', '2', '注册、登录（用户/管理员分流）'],
  ['用户', '/api/users', '4', '列表、详情、按学号查询、修改信息'],
  ['商品', '/api/items', '8', '分页、全量、详情、CRUD、按用户查、CSV 导出'],
  ['分类', '/api/categories', '3', '列表、新增、删除'],
  ['评价', '/api/reviews', '4', '按用户/商品查询、发表、卖家回复'],
  ['收藏', '/api/favorites', '3', '我的收藏、添加、取消'],
  ['消息', '/api/messages', '5', '发送、收件箱、发件箱、未读数、标记已读'],
  ['举报', '/api/reports', '3', '提交、列表（按状态筛选）、处理'],
  ['管理端', '/api/admin', '5', '运营统计、用户列表/管控、商品列表/下架'],
  ['系统', '/ 与 /api/health', '2', '系统信息、健康检查'],
];
s.addTable(apiRows, { x: 0.55, y: 1.5, w: 12.25, colW: [1.3, 2.5, 0.9, 7.55], fontSize: 12.5, fontFace: FONT, color: C.dark, border: { type: 'solid', color: C.line, pt: 1 }, rowH: 0.46, valign: 'middle' });
s.addText('前端 41 个 API 封装函数与后端接口 100% 对接；后端内置可视化接口控制台 /api-console.html 便于联调。', { x: 0.55, y: 6.75, w: 12, h: 0.4, fontSize: 12, color: C.gray, fontFace: FONT });
s.addNotes('接口设计遵循 RESTful 规范，共 39 个接口，按 10 个模块组织。商品模块最多有 8 个接口，包括游标分页和 CSV 导出；消息模块 5 个，支持收件箱、发件箱和未读数统计。所有接口返回统一的 Result 结构。前端封装了 41 个 API 函数与后端 100% 对接，11 个页面全部完成接入，后端还内置了可视化接口控制台方便联调。');

// ============================================================
// PART 05 测试与质量
// ============================================================
divider('05', '测试与质量', 'Testing & Quality', '· 功能测试    · 性能测试    · 安全测试    · 单元测试');

// 27. 测试总览
s = contentPage('PART 05  测试与质量', '测试体系与结果总览');
const stats = [
  ['20', '功能测试', '100% 通过', '正常 + 异常分支全覆盖', C.blue, C.light],
  ['8', '性能测试', '100% 通过', 'P95 < 120ms · 零错误', C.amber, C.amberBg],
  ['10', '安全测试', '80% 通过', '注入 / XSS 均拦截', C.red, C.redBg],
  ['71', '单元测试', '100% 通过', '覆盖率 59% · 核心 97%', C.green, C.greenBg],
];
stats.forEach(([num, t, rate, sub, color, bg], i) => {
  const x = 0.6 + i * 3.15;
  card(s, x, 1.6, 2.9, 2.5, bg);
  s.addText(num, { x, y: 1.85, w: 2.9, h: 0.95, fontSize: 46, bold: true, color, align: 'center', fontFace: 'Segoe UI' });
  s.addText(t, { x, y: 2.9, w: 2.9, h: 0.4, fontSize: 16, bold: true, color: C.navy, align: 'center', fontFace: FONT });
  s.addText(rate, { x, y: 3.32, w: 2.9, h: 0.35, fontSize: 13, bold: true, color, align: 'center', fontFace: FONT });
  s.addText(sub, { x: x + 0.1, y: 3.68, w: 2.7, h: 0.35, fontSize: 10.5, color: C.gray, align: 'center', fontFace: FONT });
});
card(s, 0.6, 4.45, 12.15, 2.25, C.navy);
s.addText('总体结果：109 项测试，107 项通过，总体通过率 98.2%', { x: 0.9, y: 4.7, w: 11.5, h: 0.5, fontSize: 19, bold: true, color: C.white, fontFace: FONT });
bullets(s, [
  '功能：20 项用例覆盖登录注册、商品交易、评价消息、后台管理全部业务链路及异常分支',
  '性能：100 并发压测商品详情 TPS 350、错误率 0%；前端首屏平均 1.8 秒；滚动 58 FPS',
  '单元：JUnit 5 + Mockito（@WebMvcTest），含 ParameterizedTest 参数化边界值测试',
], 0.9, 5.35, 11.6, { size: 13, gap: 0.42, color: 'DBEAFE', dotColor: '60A5FA' });
s.addNotes('测试体系包含四个维度，共 109 项测试，107 项通过，总体通过率 98.2%。功能测试 20 项全部通过，覆盖正常流程和异常分支；性能测试 8 项，100 并发压测下商品详情接口 TPS 达到 350 且零错误；安全测试 10 项，SQL 注入和 XSS 等高危攻击都被拦截；单元测试 71 个用例，整体覆盖率 59%，核心认证模块达到 97%。');

// 28. 安全测试
s = contentPage('PART 05  测试与质量', '安全防护验证（OWASP 基线）');
const secs = [
  ['SQL 注入', "登录输入 admin' OR 1=1--", 'JPA 参数化查询（PreparedStatement），注入载荷仅作字符串匹配，攻击无效', '✅ 已防护', C.green],
  ['XSS 跨站脚本', '商品标题注入 <script>alert(1)</script>', 'Vue {{ }} 插值自动 HTML 转义，脚本以纯文本展示不执行', '✅ 已防护', C.green],
  ['越权访问', '普通用户请求 /api/admin/*', '路由守卫 + 后端校验，返回 403 禁止访问', '✅ 已防护', C.green],
  ['敏感信息泄露', 'GET /api/users/1 查看返回', '密码字段 @JsonIgnore 排除，异常统一包装不暴露堆栈', '✅ 已防护', C.green],
  ['暴力破解', '连续错误密码登录', '当前无失败次数锁定机制，已记录为中危缺陷，v1.1 加入限流', '⚠ 待加固', C.amber],
];
secs.forEach(([t, attack, defense, status, color], i) => {
  const y = 1.55 + i * 1.05;
  card(s, 0.6, y, 12.15, 0.92, i === 4 ? C.amberBg : C.lighter);
  s.addShape('rect', { x: 0.6, y, w: 0.14, h: 0.92, fill: { color } });
  s.addText(t, { x: 0.9, y: y + 0.1, w: 1.7, h: 0.7, fontSize: 14.5, bold: true, color: C.navy, fontFace: FONT, valign: 'middle' });
  s.addText(attack, { x: 2.7, y: y + 0.1, w: 3.7, h: 0.72, fontSize: 11.5, color: C.red, fontFace: 'Consolas', valign: 'middle' });
  s.addText(defense, { x: 6.5, y: y + 0.1, w: 4.6, h: 0.72, fontSize: 11.5, color: C.dark, fontFace: FONT, valign: 'middle', lineSpacingMultiple: 1.15 });
  s.addText(status, { x: 11.2, y: y + 0.1, w: 1.4, h: 0.72, fontSize: 13, bold: true, color, fontFace: FONT, valign: 'middle', align: 'center' });
});
s.addNotes('安全测试参考 OWASP Top 10 基线。SQL 注入方面，JPA 使用参数化查询，注入载荷只会被当作普通字符串，攻击无效；XSS 方面，Vue 插值自动转义，脚本不会执行；越权访问由前端路由守卫和后端校验共同拦截；敏感信息方面，密码字段用 JsonIgnore 排除，异常不暴露堆栈。发现的问题是登录接口缺少暴力破解防护，已记录为中危缺陷并列入下一版本迭代计划。');

// ============================================================
// PART 06 部署与总结
// ============================================================
divider('06', '部署与总结', 'Deployment & Summary', '· 环境要求    · 启动步骤    · 项目总结');

// 30. 部署
s = contentPage('PART 06  部署与总结', '环境部署与启动步骤');
card(s, 0.6, 1.6, 6.0, 4.6, C.light);
s.addShape('rect', { x: 0.6, y: 1.6, w: 6.0, h: 0.6, fill: { color: C.blue } });
s.addText('① 后端启动（:8080）', { x: 0.85, y: 1.68, w: 5.5, h: 0.45, fontSize: 15, bold: true, color: C.white, fontFace: FONT });
s.addText(
`前置：JDK 21+、MySQL 8.0+

1. 建库
   CREATE DATABASE campus_second_hand
   DEFAULT CHARSET utf8mb4;
   （JPA 自动建表 + data.sql 种子数据）

2. cd campus-backend
3. mvnw spring-boot:run
4. 验证：http://127.0.0.1:8080/api/health`,
{ x: 0.9, y: 2.4, w: 5.5, h: 3.6, fontSize: 12.5, color: C.dark, fontFace: 'Consolas', lineSpacingMultiple: 1.35 });
card(s, 6.85, 1.6, 5.9, 4.6, C.greenBg);
s.addShape('rect', { x: 6.85, y: 1.6, w: 5.9, h: 0.6, fill: { color: C.green } });
s.addText('② 前端启动（:5173）', { x: 7.1, y: 1.68, w: 5.5, h: 0.45, fontSize: 15, bold: true, color: C.white, fontFace: FONT });
s.addText(
`前置：Node.js 18+

1. cd exam-tutor-frontend
2. npm install
3. npm run dev
4. 访问 http://127.0.0.1:5173
   （Vite 已配置 /api 代理 → 8080）

演示账号：
  管理员  admin / 123456
  用户    张三 李四 王五 / 123456`,
{ x: 7.15, y: 2.4, w: 5.4, h: 3.6, fontSize: 12.5, color: C.dark, fontFace: 'Consolas', lineSpacingMultiple: 1.35 });
card(s, 0.6, 6.35, 12.15, 0.55, C.navy);
s.addText('访问入口：前端 http://127.0.0.1:5173    |    后端接口控制台 http://127.0.0.1:8080/api-console.html', { x: 0.6, y: 6.43, w: 12.15, h: 0.4, fontSize: 12.5, color: C.white, align: 'center', fontFace: FONT });
s.addNotes('部署非常简单。后端只需要 JDK 21 和 MySQL，先创建数据库，表结构由 JPA 自动创建并导入种子数据，然后运行 mvnw spring-boot:run，服务在 8080 端口。前端需要 Node.js 环境，执行 npm install 和 npm run dev 后访问 5173 端口，Vite 已经配置好代理转发。系统内置四个演示账号：管理员 admin，以及张三、李四、王五三个用户，密码都是 123456。');

// 31. 总结
s = contentPage('PART 06  部署与总结', '项目总结与收获');
card(s, 0.6, 1.6, 12.15, 3.4, C.lighter);
s.addText('项目成果', { x: 0.9, y: 1.85, w: 5, h: 0.4, fontSize: 17, bold: true, color: C.navy, fontFace: FONT });
bullets(s, [
  '完整实现二手交易业务闭环：发布 → 浏览搜索 → 收藏沟通 → 评价举报 → 后台管控',
  '前后端分离工程实践：10 个 Controller / 39 个接口 / 11 个页面 / 41 个 API 封装，对接率 100%',
  '质量保障扎实：71 个单元测试、109 项系统测试、通过率 98.2%，JaCoCo 覆盖率 59%',
  '特色功能：游标分页、CSV 数据导出、学号精确查找、评价卖家回复、分类动态管理',
], 0.9, 2.4, 11.6, { size: 13.5, gap: 0.6, loose: true });
card(s, 0.6, 5.2, 5.95, 1.55, C.amberBg);
s.addText('待完善（v1.1 计划）', { x: 0.9, y: 5.4, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.amber, fontFace: FONT });
bullets(s, ['登录失败次数锁定与接口限流', 'JWT Token 鉴权替代 Session'], 0.9, 5.85, 5.4, { size: 12.5, gap: 0.4, dotColor: C.amber });
card(s, 6.8, 5.2, 5.95, 1.55, C.greenBg);
s.addText('技术收获', { x: 7.1, y: 5.4, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.green, fontFace: FONT });
bullets(s, ['掌握 Spring Boot + Vue 全栈开发流程', '实践 RESTful 设计与自动化测试方法'], 7.1, 5.85, 5.4, { size: 12.5, gap: 0.4, dotColor: C.green });
s.addNotes('项目成果方面：我们完整实现了二手交易的业务闭环，工程上包含 10 个 Controller、39 个接口和 11 个页面，前后端对接率 100%；质量保障方面，71 个单元测试加 109 项系统测试，通过率 98.2%。当然项目还有可以完善的地方，比如登录防暴力破解和 JWT 鉴权，已经列入下一版本计划。通过这次课程设计，我们完整实践了从需求分析、数据库设计、前后端开发到测试部署的全栈开发流程。');

// 32. 致谢
s = pptx.addSlide();
s.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });
s.addShape('ellipse', { x: 9.2, y: -2.5, w: 6.5, h: 6.5, fill: { color: '16366F' } });
s.addShape('ellipse', { x: -2.5, y: 4.8, w: 5.5, h: 5.5, fill: { color: '16366F' } });
s.addText('感谢各位老师的聆听！', { x: 1, y: 2.7, w: 11.3, h: 1.0, fontSize: 40, bold: true, color: C.white, align: 'center', fontFace: FONT });
s.addText('敬请批评指正', { x: 1, y: 3.9, w: 11.3, h: 0.6, fontSize: 22, color: '93C5FD', align: 'center', fontFace: FONT });
s.addShape('rect', { x: 5.67, y: 4.8, w: 2, h: 0.06, fill: { color: C.sky } });
s.addText('校园二手物品交易系统  ·  2026 年 9 月', { x: 1, y: 5.2, w: 11.3, h: 0.4, fontSize: 13, color: '7FB0F5', align: 'center', fontFace: FONT });
s.addNotes('我的汇报到此结束，感谢各位老师的聆听，敬请批评指正！');

pptx.writeFile({ fileName: OUT }).then(f => console.log('生成成功:', f));
