/**
 * 旧易货(jiuyihuo.cn) → 校园二手交易系统 数据迁移脚本
 * ============================================================
 * 功能：
 *  1. robots.txt 合规检查（Disallow 空值 = 允许全站爬取）
 *  2. 分页拉取全部商品列表（/api/products）
 *  3. 逐个拉取商品详情（300ms 礼貌延迟）
 *  4. 下载商品图片 → public/item-img/（存在即跳过）
 *  5. 生成 UPSERT SQL 并导入 MySQL（不破坏外键引用）
 *  6. 断点续传：checkpoint.json 记录进度，重跑自动跳过已完成步骤
 *  7. 生成迁移报告 migration-report.md
 *
 * 用法：node scripts/migrate-jiuyihuo.mjs [--fresh] [--no-import]
 *   --fresh      忽略 checkpoint 从头开始
 *   --no-import  只生成 SQL 不执行导入
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// ---------- 配置 ----------
const SRC = 'https://www.jiuyihuo.cn';
const UA = 'Mozilla/5.0 (compatible; CampusMigrator/1.0; +study-project)';
const FRONTEND_ROOT = path.resolve(import.meta.dirname, '..');
const IMG_DIR = path.join(FRONTEND_ROOT, 'public', 'item-img');
const OUT_DIR = path.join(FRONTEND_ROOT, 'scripts', 'migration-output');
const CHECKPOINT = path.join(OUT_DIR, 'checkpoint.json');
const SQL_FILE = path.join(OUT_DIR, 'items-upsert.sql');
const REPORT = path.join(OUT_DIR, 'migration-report.md');

const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 9.5\\bin\\mysql.exe';
const DB_ARGS = ['-uroot', '-p123456', '--default-character-set=utf8mb4', 'campus_second_hand'];

const DELAY_DETAIL = 300; // 详情请求间隔 ms
const DELAY_IMG = 150;    // 图片下载间隔 ms

const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has('--no-import');

// 源站分类 → 本地 t_category 映射
// 源站: 1二手书籍教材 2数码电子 3宿舍生活 4服饰美妆 5考研公考 6以物换物 7求购广场 8避坑指南
// 本地: 1教材书籍 2电子产品 3生活用品 4运动器材 5服饰美妆 6其他
const CAT_MAP = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 1, 6: 6, 7: 6, 8: 6 };

// ---------- 工具函数 ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));

function esc(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    .replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
}

function sanitizeName(name) {
  return String(name).replace(/[^A-Za-z0-9._-]/g, '_');
}

/** 成色文本 → condition_level 1-5 */
function mapCondition(p) {
  const s = [p.condition, p.badge, ...(p.tags || []).map(t => t.name)].join(' ');
  if (/几乎全新|95新|99新|9\.5成/.test(s)) return 2;
  if (/全新/.test(s)) return 1;
  if (/9成|90新|9成新/.test(s)) return 3;
  if (/8成|85新|80新|7成/.test(s)) return 4;
  if (/磨损|破旧|很旧/.test(s)) return 5;
  return 3;
}

/** 本地 user 轮转：1张三 2李四 3王五 */
const mapUser = id => ((Number(id) || 1) - 1) % 3 + 1;

/** 规范化图片 URL */
function imgUrl(cover) {
  if (!cover) return null;
  if (cover.startsWith('http')) return cover;
  return SRC + '/' + String(cover).replace(/^\//, '');
}

// ---------- checkpoint ----------
function loadCheckpoint() {
  try {
    if (!ARGS.has('--fresh') && fs.existsSync(CHECKPOINT)) {
      const cp = JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
      console.log(`[resume] 发现断点: phase=${cp.phase}, 已发现 ${Object.keys(cp.products || {}).length} 商品, 图片已处理 ${Object.keys(cp.images || {}).length}`);
      return cp;
    }
  } catch { /* 损坏的 checkpoint 视为无断点 */ }
  return { phase: 'robots', products: {}, detailsFetched: [], images: {}, failures: [], sqlGenerated: false, imported: false };
}
const cp = loadCheckpoint();

function saveCheckpoint() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 1));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}

// ---------- Phase 0: robots.txt ----------
async function checkRobots() {
  if (cp.robotsChecked) { console.log('[robots] 已检查过（断点跳过）'); return; }
  const res = await fetch(SRC + '/robots.txt', { headers: { 'User-Agent': UA } });
  const txt = await res.text();
  const disallowAll = /^\s*User-agent:\s*\*\s*$/im.test(txt) && /Disallow:\s*\*/.test(txt);
  if (disallowAll) {
    console.error('[robots] 目标站禁止爬取，终止迁移！');
    process.exit(1);
  }
  cp.robotsChecked = true;
  cp.robotsText = txt.trim();
  cp.phase = 'discover';
  saveCheckpoint();
  console.log('[robots] 合规 ✓', JSON.stringify(txt.trim()));
}

// ---------- Phase 1: 分页发现全部商品 ----------
async function discoverProducts() {
  cp.phase = 'discover';
  let page = (cp.listPagesFetched || 0) + 1;
  let total = cp.totalExpected || null;
  console.log(`[discover] 从第 ${page} 页继续...`);
  while (true) {
    const json = await fetchJson(`${SRC}/api/products?per_page=100&page=${page}`);
    const arr = json.data || [];
    total = json.total ?? total;
    cp.totalExpected = total;
    for (const p of arr) cp.products[p.id] = p;
    cp.listPagesFetched = page;
    console.log(`  page ${page}: +${arr.length} (累计 ${Object.keys(cp.products).length}/${total})`);
    saveCheckpoint();
    if (arr.length < 100 || Object.keys(cp.products).length >= total) break;
    page++;
    await sleep(300);
  }
  cp.phase = 'detail';
  saveCheckpoint();
}

// ---------- Phase 2: 逐个拉详情（字段最全，含 tags/user） ----------
async function fetchDetails() {
  cp.phase = 'detail';
  const ids = Object.keys(cp.products).map(Number).sort((a, b) => a - b);
  const done = new Set(cp.detailsFetched);
  console.log(`[detail] 共 ${ids.length} 个商品，已完成 ${done.size}`);
  let n = 0;
  for (const id of ids) {
    if (done.has(id)) continue;
    try {
      const json = await fetchJson(`${SRC}/api/products/${id}`);
      cp.products[id] = { ...cp.products[id], ...json.data };
      cp.detailsFetched.push(id);
      if (++n % 10 === 0) { saveCheckpoint(); console.log(`  detail ${done.size + n}/${ids.length}`); }
    } catch (e) {
      cp.failures.push({ id, phase: 'detail', reason: e.message });
      console.log(`  FAIL detail id=${id}: ${e.message}`);
    }
    await sleep(DELAY_DETAIL);
  }
  saveCheckpoint();
  cp.phase = 'images';
  saveCheckpoint();
}

// ---------- Phase 3: 下载图片 ----------
async function downloadImages() {
  cp.phase = 'images';
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const ids = Object.keys(cp.products).map(Number).sort((a, b) => a - b);
  let ok = 0, skip = 0, noimg = 0;
  for (const id of ids) {
    const p = cp.products[id];
    const url = imgUrl(p.cover_image);
    if (!url) { noimg++; continue; }
    const rec = cp.images[id];
    const fname = `p${id}_${sanitizeName(url.split('/').pop())}`;
    const localPath = path.join(IMG_DIR, fname);
    if (rec?.status === 'ok' && fs.existsSync(localPath) && fs.statSync(localPath).size > 0) { skip++; continue; }
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error('文件过小 ' + buf.length + 'B');
      fs.writeFileSync(localPath, buf);
      cp.images[id] = { status: 'ok', file: fname, bytes: buf.length, src: url };
      ok++;
      if (ok % 10 === 0) { saveCheckpoint(); console.log(`  img ok=${ok} skip=${skip}/${ids.length}`); }
    } catch (e) {
      cp.images[id] = { status: 'fail', src: url, reason: e.message };
      cp.failures.push({ id, phase: 'image', reason: `${url}: ${e.message}` });
    }
    await sleep(DELAY_IMG);
  }
  saveCheckpoint();
  console.log(`[images] 新下载 ${ok}, 断点跳过 ${skip}, 无图商品 ${noimg}, 失败 ${cp.failures.filter(f => f.phase === 'image').length}`);
  cp.phase = 'sql';
  saveCheckpoint();
}

// ---------- Phase 4: 生成 UPSERT SQL ----------
function buildRow(p) {
  const id = p.id;
  const imgRec = cp.images[id];
  const images = imgRec?.status === 'ok' ? '/item-img/' + imgRec.file : '';
  const price = Number(p.price ?? 0).toFixed(2);
  const orig = p.original_price != null ? Number(p.original_price).toFixed(2) : 'NULL';
  const desc = p.description ?? '暂无描述';
  const status = p.status === 1 ? 1 : 2;
  const views = Number(p.views ?? 0);
  const created = (p.created_at || '').slice(0, 19).replace('T', ' ') || 'NOW()';
  const updated = (p.updated_at || '').slice(0, 19).replace('T', ' ') || 'NOW()';
  const catId = CAT_MAP[p.category_id] ?? 6;
  const userId = mapUser(p.user_id || id);
  const cond = mapCondition(p);
  return `(${id},${userId},${catId},'${esc(p.title)}','${esc(desc)}',${price},${orig},${cond},'${esc(images)}',${status},${views},'${created}','${updated}')`;
}

async function generateSql() {
  if (cp.sqlGenerated && fs.existsSync(SQL_FILE)) { console.log('[sql] 已生成（断点跳过）'); return; }
  cp.phase = 'sql';
  const ids = Object.keys(cp.products).map(Number).sort((a, b) => a - b);
  const rows = [];
  const rowErrors = [];
  for (const id of ids) {
    const p = cp.products[id];
    if (!p?.title || p.price == null) { rowErrors.push({ id, reason: '缺少 title/price' }); continue; }
    rows.push(buildRow(p));
  }
  const cols = 'item_id,user_id,category_id,title,description,price,original_price,condition_level,images,status,view_count,create_time,update_time';
  const updates = cols.split(',').filter(c => c !== 'item_id').map(c => `${c}=new.${c}`).join(', ');
  const sql = [
    '-- 旧易货商品数据迁移 UPSERT（自动生成，可重复执行）',
    '-- 生成时间: ' + new Date().toISOString(),
    'START TRANSACTION;',
    ...rows.map(r => `INSERT INTO t_item (${cols}) VALUES ${r} AS new ON DUPLICATE KEY UPDATE ${updates};`),
    'COMMIT;'
  ].join('\n');
  fs.writeFileSync(SQL_FILE, sql, 'utf8');
  cp.sqlGenerated = true;
  cp.rowErrors = rowErrors;
  saveCheckpoint();
  console.log(`[sql] 生成 ${rows.length} 行 UPSERT → ${SQL_FILE}（校验失败 ${rowErrors.length}）`);
}

// ---------- Phase 5: 执行导入 ----------
function importSql() {
  if (DRY_RUN) { console.log('[import] --no-import 跳过'); return; }
  if (cp.imported) { console.log('[import] 已导入（断点跳过）'); return; }
  cp.phase = 'import';
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  // SQL 内容通过 stdin 传入，避免 Windows 路径反斜杠被 mysql source 命令误解析
  execFileSync(MYSQL, DB_ARGS, { encoding: 'utf8', timeout: 60000, input: sql });
  // 校验
  const cnt = execFileSync(MYSQL, [...DB_ARGS, '-N', '-e', 'SELECT COUNT(*) FROM t_item;'], { encoding: 'utf8' }).trim();
  cp.imported = true;
  cp.importCount = Number(cnt);
  saveCheckpoint();
  console.log(`[import] 完成 ✓  t_item 总行数 = ${cnt}`);
}

// ---------- Phase 6: 报告 ----------
function generateReport() {
  const ids = Object.keys(cp.products).map(Number).sort((a, b) => a - b);
  const imgOk = ids.filter(id => cp.images[id]?.status === 'ok');
  const imgFail = ids.filter(id => cp.images[id]?.status === 'fail');
  const noImg = ids.filter(id => !cp.images[id]);
  const detailFail = cp.failures.filter(f => f.phase === 'detail');
  const rowErr = cp.rowErrors || [];

  const md = `# 旧易货 → 校园二手交易系统 数据迁移报告

- **迁移时间**: ${new Date().toLocaleString('zh-CN')}
- **源站**: ${SRC}（robots.txt: ${cp.robotsText || '已检查'} → 允许爬取）
- **目标数据库**: campus_second_hand.t_item（UPSERT 策略，不破坏 t_order 等外键引用）

## 总览

| 指标 | 数量 |
|---|---|
| 源站商品总数 | ${ids.length} |
| 详情抓取成功 | ${ids.length - detailFail.length} |
| 详情抓取失败 | ${detailFail.length} |
| 图片下载成功 | ${imgOk.length} |
| 图片下载失败 | ${imgFail.length} |
| 无图商品（源站用渐变占位） | ${noImg.length} |
| SQL 行生成成功 | ${ids.length - rowErr.length} |
| SQL 行校验失败 | ${rowErr.length} |
| 导入后 t_item 总行数 | ${cp.importCount ?? '(未导入)'} |

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

${detailFail.length + imgFail.length + rowErr.length === 0 ? '（无失败项 ✓）' : [
    ...detailFail.map(f => `- 商品 ${f.id} [详情抓取] ${f.reason}`),
    ...imgFail.map(id => `- 商品 ${id} [图片] ${cp.images[id]?.src}: ${cp.images[id]?.reason}`),
    ...rowErr.map(f => `- 商品 ${f.id} [SQL行] ${f.reason}`)
  ].join('\n')}

## 无图商品清单（共 ${noImg.length} 件，前端显示渐变占位）

${noImg.length ? noImg.map(id => `- ${id}: ${cp.products[id]?.title}`).join('\n') : '（无）'}

## 断点续传说明

进度保存在 \`scripts/migration-output/checkpoint.json\`。中断后重新运行本脚本会自动跳过已完成的
列表分页 / 详情抓取 / 图片下载 / SQL 生成 / 导入步骤。使用 \`--fresh\` 参数可强制从头迁移。
`;
  fs.writeFileSync(REPORT, md, 'utf8');
  console.log(`[report] 已生成 → ${REPORT}`);
}

// ---------- main ----------
try {
  await checkRobots();
  await discoverProducts();
  await fetchDetails();
  await downloadImages();
  await generateSql();
  importSql();
  generateReport();
  console.log('\n=== 迁移全部完成 ✓ ===');
} catch (e) {
  cp.failures.push({ id: 0, phase: 'fatal', reason: e.message });
  saveCheckpoint();
  console.error('\n[FATAL]', e.message);
  generateReport();
  process.exit(1);
}
