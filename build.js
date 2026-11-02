// build.js: 静态构建与全站 SEO 规范严格校验脚本
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://huanqiuti.com';

const pages = [
  'index.html',
  'nodes.html',
  'pricing.html',
  'tutorials/index.html',
  'tutorials/clash-verge.html',
  'tutorials/shadowrocket.html',
  'articles/index.html',
  'articles/iepl-vs-transit-performance-2026.html',
  'articles/chatgpt-claude-unlock-clean-ip-2026.html',
  'articles/bbrv3-quic-throughput-optimization-2026.html',
  'articles/udp-gaming-voice-mtu-tuning-2026.html',
  'status.html',
  'sitemap.html'
];

console.log('🚀 开始全站 SEO 与超链接健康度检查...');

let hasErrors = false;

// 辅助函数：计算中文字符与英文字符的混合显示长度（汉字算2，英文字符算1）
function getDisplayLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0x4e00 && code <= 0x9fa5) {
      len += 2;
    } else {
      len += 1;
    }
  }
  return len;
}

// 辅助函数：统计纯汉字个数
function getChineseCharCount(str) {
  const matches = str.match(/[\u4e00-\u9fa5]/g);
  return matches ? matches.length : 0;
}

// 收集所有已生成的文件集合，用于死链排查
const existingFiles = new Set(pages);

pages.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件缺失: ${file}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // 1. 标题校验
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch) {
    console.error(`❌ ${file} 缺少 <title> 标签`);
    hasErrors = true;
  } else {
    const title = titleMatch[1].trim();
    const displayLen = getDisplayLength(title);
    const cnCount = getChineseCharCount(title);
    console.log(`📄 [${file}] Title: "${title}" (中文字数: ${cnCount}, 渲染长度: ${displayLen})`);

    if (!title.endsWith(' | 环球梯')) {
      console.error(`❌ ${file} 标题后缀不合规，必须以 " | 环球梯" 结尾`);
      hasErrors = true;
    }
    // 标题长度规范：22~26个汉字（50~60字符）
    if (displayLen < 48 || displayLen > 62) {
      console.warn(`⚠️ [警告] ${file} 标题渲染长度 ${displayLen} 不在 50~60 建议区间`);
      if (displayLen < 46 || displayLen > 65) {
        console.error(`❌ [错误] ${file} 标题渲染长度超出安全界限: ${displayLen}`);
        hasErrors = true;
      }
    }
  }

  // 2. 描述校验
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
                    content.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
  if (!descMatch) {
    console.error(`❌ ${file} 缺少 <meta name="description">`);
    hasErrors = true;
  } else {
    const desc = descMatch[1].trim();
    const cnCount = getChineseCharCount(desc);
    console.log(`📝 [${file}] Description 汉字数: ${cnCount} (总字符: ${desc.length})`);
    if (cnCount < 80 || cnCount > 100) {
      console.warn(`⚠️ [注意] ${file} 描述汉字数为 ${cnCount}，严格区间建议 80~100 汉字`);
      if (cnCount < 75 || cnCount > 105) {
        console.error(`❌ [错误] ${file} 描述汉字数脱离合规区间: ${cnCount}`);
        hasErrors = true;
      }
    }
  }

  // 3. 权威标签 canonical 校验
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  if (!canonicalMatch) {
    console.error(`❌ ${file} 缺少 <link rel="canonical"> 标签`);
    hasErrors = true;
  } else {
    const href = canonicalMatch[1].trim();
    if (!href.startsWith('https://')) {
      console.error(`❌ ${file} canonical 必须使用完整 https URL: ${href}`);
      hasErrors = true;
    }
  }

  // 4. 超链接死链与空格排查
  const hrefMatches = content.matchAll(/href=["'](.*?)["']/gi);
  for (const m of hrefMatches) {
    const href = m[1].trim();
    if (href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    if (href.includes(' ')) {
      console.error(`❌ ${file} 内部链接包含空格: "${href}"`);
      hasErrors = true;
    }

    // 解析相对路径
    const cleanHref = href.split('#')[0].split('?')[0];
    if (cleanHref && !cleanHref.endsWith('.css') && !cleanHref.endsWith('.png') && !cleanHref.endsWith('.jpg') && !cleanHref.endsWith('.svg') && !cleanHref.endsWith('.xml') && !cleanHref.endsWith('.txt')) {
      let targetFile = cleanHref.startsWith('/') ? cleanHref.slice(1) : path.join(path.dirname(file), cleanHref);
      targetFile = targetFile.replace(/\\/g, '/');
      if (targetFile.endsWith('/')) targetFile += 'index.html';
      if (!existingFiles.has(targetFile) && !fs.existsSync(path.join(__dirname, targetFile))) {
        console.error(`❌ ${file} 发现死链 -> ${cleanHref} (解析为 ${targetFile})`);
        hasErrors = true;
      }
    }
  }
});

// 生成/校验 sitemap.xml
const sitemapPath = path.join(__dirname, 'sitemap.xml');
let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
const today = new Date().toISOString().split('T')[0];

pages.forEach(p => {
  const urlPath = p === 'index.html' ? '' : p;
  const loc = `${DOMAIN}/${urlPath}`;
  const priority = p === 'index.html' ? '1.0' : (p.startsWith('articles/') || p.startsWith('tutorials/') ? '0.8' : '0.6');
  xmlContent += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
});
xmlContent += `</urlset>\n`;
fs.writeFileSync(sitemapPath, xmlContent, 'utf8');
console.log(`✅ sitemap.xml 校验生成完成 (${pages.length} 个页面)`);

// 生成/校验 robots.txt
const robotsPath = path.join(__dirname, 'robots.txt');
const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`;
fs.writeFileSync(robotsPath, robotsContent, 'utf8');
console.log(`✅ robots.txt 校验生成完成`);

// 同步 public/ 静态资源（如 IndexNow 密钥验证文件）到产物根目录
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  publicFiles.forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(__dirname, file);
    fs.copyFileSync(src, dest);
  });
  console.log(`✅ 已同步 public/ 静态资产到站点根目录 (${publicFiles.length} 个文件)`);
}

if (hasErrors) {
  console.error('\n❌ 存在不符合规范的项目，请检查上方日志！');
  process.exit(1);
} else {
  console.log('\n🎉 全站 SEO、权威标签及超链接 100% 校验通过！');
}
