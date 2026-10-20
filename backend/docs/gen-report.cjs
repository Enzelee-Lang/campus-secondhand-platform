// 生成单元测试作业 .docx 文档（v2：71 用例，59% 覆盖率）
const docx = require('docx');
const fs = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType
} = docx;

const src = 'c:/Users/李恩泽/AppData/Local/Temp/trae/screenshots';
const outDir = 'd:/campus-backend/docs';

function img(filename, w, h) {
  const p = path.join(src, filename);
  return new ImageRun({ data: fs.readFileSync(p), transformation: { width: w, height: h } });
}

function h1(text) {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 44, font: 'Microsoft YaHei' })], spacing: { before: 240, after: 120 } });
}
function h2(text) {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 32, font: 'Microsoft YaHei', color: '2563EB' })], spacing: { before: 300, after: 100 } });
}
function h3(text) {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 26, font: 'Microsoft YaHei' })], spacing: { before: 200, after: 80 } });
}
function p(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 22, font: 'Microsoft YaHei' })], spacing: { after: 80 } });
}
function code(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Consolas' })], indent: { left: 360 }, shading: { type: ShadingType.SOLID, color: 'F5F5F5' }, spacing: { after: 60 } });
}
function pic(filename, w, h, caption) {
  const items = [new Paragraph({ children: [img(filename, w, h)], alignment: AlignmentType.CENTER, spacing: { after: 60 } })];
  if (caption) items.push(new Paragraph({ children: [new TextRun({ text: caption, italics: true, size: 20, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
  return items;
}

// === 测试统计表（v2：9 类 × 71 用例）===
const testStats = [
  { name: 'Md5UtilTest', tests: 6, desc: 'MD5 工具类：空串/已知值/中文/幂等/格式' },
  { name: 'AuthControllerTest', tests: 13, desc: '登录注册 9 个基础 + 3 组参数化（密码/用户名/非法 type）：覆盖成功/密码错/不存在/禁用/重复' },
  { name: 'ItemControllerTest', tests: 8, desc: '商品 CRUD：列表/详情(浏览量+1)/不存在/创建(自动上架)/修改/删除' },
  { name: 'FavoriteControllerTest', tests: 4, desc: '收藏增删：添加/重复报错/取消收藏' },
  { name: 'ReviewControllerTest', tests: 5, desc: '评价查询 + 卖家回复：按用户/商品查/发表/回复/回复不存在' },
  { name: 'UserControllerTest', tests: 7, desc: '用户接口：列表/详情/不存在/按学号查/按学号不存在/修改邮箱/修改不存在' },
  { name: 'CategoryControllerTest', tests: 3, desc: '分类接口：列表/新增/删除' },
  { name: 'MessageControllerTest', tests: 6, desc: '站内消息：发送(自动 isRead=0)/收件箱/发件箱/未读数/标记已读/已读不存在' },
  { name: 'AdminControllerTest', tests: 7, desc: '管理端：运营统计/全部用户/启用禁用/禁用不存在/全部商品/下架/下架不存在' },
  { name: 'ReportControllerTest', tests: 5, desc: '举报接口：提交(自动 status=0)/全部/按状态筛选/处理/处理不存在' },
];

const totalTests = testStats.reduce((s, x) => s + x.tests, 0);

const tableRows = [
  new TableRow({ children: [
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '测试类', bold: true, size: 22 })] })], width: { size: 1800, type: WidthType.DXA } }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '用例数', bold: true, size: 22 })] })], width: { size: 800, type: WidthType.DXA } }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '覆盖范围', bold: true, size: 22 })] })], width: { size: 5400, type: WidthType.DXA } }),
  ]}),
  ...testStats.map(s => new TableRow({ children: [
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.name, size: 22, font: 'Consolas' })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(s.tests), size: 22 })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.desc, size: 22 })] })] }),
  ]})),
  new TableRow({ children: [
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '合计', bold: true, size: 22 })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totalTests), bold: true, size: 22, color: '22C55E' })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '全部通过 (Failures: 0, Errors: 0, Skipped: 0)', bold: true, size: 22, color: '22C55E' })] })] }),
  ]}),
];

const statsTable = new Table({
  rows: tableRows,
  width: { size: 8000, type: WidthType.DXA },
});

// === 构建文档 ===
const children = [
  // 封面
  new Paragraph({ children: [new TextRun({ text: '校园二手物品交易系统', bold: true, size: 56, font: 'Microsoft YaHei', color: '1E40AF' })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 } }),
  new Paragraph({ children: [new TextRun({ text: '单元测试与覆盖率实验报告', bold: true, size: 40, font: 'Microsoft YaHei', color: '1E40AF' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  new Paragraph({ children: [new TextRun({ text: '日期：2026-09-08    后端：Spring Boot 3.4.5    测试框架：JUnit 5 + Mockito + JaCoCo', size: 22, color: '64748B' })], alignment: AlignmentType.CENTER, spacing: { after: 500 } }),

  h2('一、项目代码与功能对应'),
  p('本项目为校园二手物品交易系统后端，基于 Spring Boot + JPA + MySQL 实现，共 10 个 Controller、9 个 Repository、32 个业务接口。各 Controller 与实现功能一一对应如下：'),

  h3('模块对照表'),
  code('AuthController      →  /api/auth/register  注册'),
  code('AuthController      →  /api/auth/login    登录（user/admin 分流）'),
  code('ItemController      →  /api/items/*       商品全量/分页/详情/发布/修改/删除/导出'),
  code('UserController      →  /api/users/*       用户列表/详情/按学号查询/修改信息'),
  code('CategoryController  →  /api/categories/*  分类增删改'),
  code('ReviewController    →  /api/reviews/*     评价查询/发表/卖家回复'),
  code('FavoriteController  →  /api/favorites/*   收藏增删查'),
  code('MessageController   →  /api/messages/*    站内消息发送/收件箱/发件箱/未读/已读'),
  code('ReportController    →  /api/reports/*     举报提交/列表/处理'),
  code('AdminController     →  /api/admin/*      运营统计/用户管理/商品下架'),
  code('Md5Util（工具类）    →  密码 MD5 加密'),

  h2('二、测试环境与依赖配置'),
  h3('pom.xml 新增依赖'),
  code('<dependency>'),
  code('  <groupId>com.h2database</groupId>'),
  code('  <artifactId>h2</artifactId>'),
  code('  <scope>test</scope>'),
  code('</dependency>'),
  p('注：spring-boot-starter-test 已包含 JUnit 5 + Mockito，无需额外引入。H2 内存数据库用于 @SpringBootTest 连接测试，@WebMvcTest 层使用 MockBean 无需真实 DB。'),

  h3('JaCoCo 覆盖率插件配置'),
  code('<plugin>'),
  code('  <groupId>org.jacoco</groupId>'),
  code('  <artifactId>jacoco-maven-plugin</artifactId>'),
  code('  <version>0.8.12</version>'),
  code('  <executions>'),
  code('    <execution><goal>prepare-agent</goal></execution>'),
  code('    <execution><id>report</id><phase>test</phase><goal>report</goal></execution>'),
  code('    <execution><id>jacoco-check</id><goal>check</goal>'),
  code('  </executions>'),
  code('</plugin>'),
  p('覆盖率阈值设为 LINE >= 30%，低于则 mvn test 构建失败。'),

  h3('Mockito subclass mock maker 配置'),
  p('由于 JDK 21 下 inline mock maker 的 agent attachment 机制不可用，在 src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker 中配置 subclass 策略：'),
  code('mock-maker-subclass'),

  h2('三、测试类清单与统计'),
  statsTable,
  p(''),

  h2('四、单元测试代码示例'),
  h3('4.1 Md5UtilTest — 工具类纯单元测试'),
  code('@Test @DisplayName("md5: 中文输入 → 正确哈希")'),
  code('void md5_chinese() {'),
  code('  String hash = Md5Util.md5("你好");'),
  code('  assertEquals("7eca689f0d3389d9dea66ae112e5cfd7", hash);'),
  code('}'),

  h3('4.2 AuthControllerTest — 含参数化边界值测试'),
  code('@ParameterizedTest'),
  code('@DisplayName("POST /api/auth/login: 密码长度边界值")'),
  code('@ValueSource(strings = {"", "1", "12345678901234567890123456789012"})'),
  code('void login_passwordBoundary(String password) throws Exception {'),
  code('  // 空串/1位/32位超长 都不等于 MD5("123456")'),
  code('  // 期望 code=500 登录失败'),
  code('}'),
  p('参数化测试用 3 组 @ValueSource 覆盖密码长度边界、用户名边界、非法 type 值，每组 3-4 个输入，等价覆盖 10+ 个场景。'),

  h3('4.3 AdminControllerTest — 管理端多依赖 MockBean'),
  code('@WebMvcTest(AdminController.class)'),
  code('class AdminControllerTest {'),
  code('  @MockBean UserRepository userRepository;'),
  code('  @MockBean ItemRepository itemRepository;'),
  code('  @MockBean AdminRepository adminRepository;'),
  code('  @MockBean ReportRepository reportRepository;'),
  code(''),
  code('  @Test void stats() { // 运营统计 map 4 个 count 调用 }'),
  code('  @Test void toggleUser_found() { // 禁用/启用用户 }'),
  code('  @Test void offShelf_notFound() { // 商品不存在 → 404 }'),
  code('}'),

  h2('五、测试执行结果'),
  p('执行命令：mvn test'),
  code('[INFO] Tests run: 71, Failures: 0, Errors: 0, Skipped: 0'),
  code('[INFO] BUILD SUCCESS'),
  code('[INFO] Total time:  19.167 s'),
  p('71 个测试用例全部通过，其中 AuthControllerTest 13 个（含参数化），覆盖 10 个业务模块的 9 个 Controller + 1 个工具类。'),

  h2('六、JaCoCo 覆盖率报告'),
  p('项目整体覆盖率：**指令 59% / 分支 30%**（AuthController 指令覆盖率高达 97%），远超 30% 阈值。'),
  ...pic('jacoco-coverage-overview.png', 640, 360, '图 6-1 项目整体覆盖率总览（指令 59%，分支 30%）'),
  ...pic('jacoco-controller-package.png', 640, 400, '图 6-2 Controller 层各类覆盖率详情'),
  ...pic('jacoco-authcontroller-source.png', 720, 440, '图 6-3 AuthController 代码行覆盖详情（指令覆盖 97%，绿色行=已覆盖）'),

  h2('七、总结'),
  h3('已完成'),
  p('1. 使用 CodeGeeX 辅助生成了 10 个测试类、71 个测试用例，覆盖全部 10 个 Controller 模块 + 1 个工具类'),
  p('2. AuthControllerTest 引入 ParameterizedTest + @ValueSource 实现密码/用户名/非法 type 边界值参数化测试（3 组 × 3-4 输入）'),
  p('3. 所有测试全部通过，JaCoCo 报告生成成功，整体覆盖率达 59%（超过 30% 阈值，AuthController 达 97%）'),
  p('4. @WebMvcTest + @MockBean 模式避免真实数据库依赖，测试执行快速（~19s 跑完 71 用例）、隔离性好'),
  p('5. Mockito subclass mock maker 配置解决了 JDK 21 下 inline mock maker 的 agent attachment 兼容问题'),

  h3('可继续提升'),
  p('1. 覆盖率目标可进一步提升至 70%+，重点补充 ItemController 的分页/导出、AdminController 的 items() 等方法'),
  p('2. 增加 @SpringBootTest + H2 的集成测试，覆盖 Repository 层 JPA 查询逻辑'),
  p('3. 可引入 CSV 格式的 @CsvSource 参数化测试，对登录注册更多边界值进行数据驱动测试'),
];

const doc = new Document({
  sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }]
});

Packer.toBuffer(doc).then(buf => {
  const fp = path.join(outDir, '单元测试与覆盖率实验报告.docx');
  fs.writeFileSync(fp, buf);
  console.log('生成成功:', fp, '(' + (buf.length / 1024).toFixed(1) + ' KB)');
});
