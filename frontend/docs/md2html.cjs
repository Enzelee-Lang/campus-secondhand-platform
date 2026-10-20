// 将 Markdown + 本地图片转换为单文件 HTML（图片内嵌为 base64），便于 Edge headless 打印 PDF
const fs = require('fs')
const path = require('path')
const { marked } = require('D:/campus-backend/node_modules/marked')

const docsDir = __dirname
const mdPath = path.join(docsDir, '项目功能界面说明.md')
const htmlPath = path.join(docsDir, '项目功能界面说明.html')

const md = fs.readFileSync(mdPath, 'utf8')
let htmlBody = marked.parse(md, { breaks: false, gfm: true })

// 把 <img src="screenshots/xxx.png"> 替换为 base64 data URL
const imgRegex = /<img\s+src="screenshots\/([^"]+)"([^>]*)>/g
htmlBody = htmlBody.replace(imgRegex, (m, file, rest) => {
  // marked 可能将中文文件名做 URL 编码，先解码
  const decoded = decodeURIComponent(file)
  const imgPath = path.join(docsDir, 'screenshots', decoded)
  if (!fs.existsSync(imgPath)) {
    console.warn('missing image:', imgPath)
    return m
  }
  const buf = fs.readFileSync(imgPath)
  const ext = path.extname(decoded).slice(1).toLowerCase()
  const mime = ext === 'jpg' ? 'jpeg' : ext
  const b64 = buf.toString('base64')
  return `<img src="data:image/${mime};base64,${b64}"${rest}>`
})

const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>校园二手物品交易系统 · 功能界面说明</title>
<style>
  body {
    font-family: "Microsoft YaHei", "Segoe UI", -apple-system, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 40px;
    color: #1f2937;
    line-height: 1.7;
    font-size: 14px;
  }
  h1 { font-size: 26px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #1e3a8a; }
  h2 { font-size: 20px; margin-top: 32px; border-left: 4px solid #3b82f6; padding-left: 10px; color: #1e40af; }
  h3 { font-size: 16px; margin-top: 24px; color: #334155; }
  blockquote { color: #64748b; border-left: 3px solid #cbd5e1; margin: 0; padding: 4px 14px; background: #f8fafc; }
  code { background: #f1f5f9; padding: 1px 6px; border-radius: 3px; font-family: Consolas, monospace; font-size: 13px; color: #be185d; }
  pre { background: #f8fafc; padding: 12px 16px; border-radius: 6px; overflow-x: auto; border: 1px solid #e2e8f0; }
  pre code { background: none; padding: 0; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; color: #334155; }
  tr:nth-child(even) td { background: #fafbfc; }
  img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 6px; margin: 8px 0; display: block; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
  a { color: #2563eb; }
  @page { margin: 18mm 14mm; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`

fs.writeFileSync(htmlPath, fullHtml, 'utf8')
console.log('HTML generated:', htmlPath, '(' + (fullHtml.length / 1024).toFixed(1) + ' KB)')
