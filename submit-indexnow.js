// submit-indexnow.js: 自动读取 sitemap.xml 并向 IndexNow API 提交最新 URL
const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'huanqiutigw.com';
const API_KEY = '08409758e1432c61a0b625f235bf6c90';
const KEY_LOCATION = `https://${HOST}/${API_KEY}.txt`;
const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');

// 1. 读取 sitemap.xml 中的 URL 列表
function getUrlsFromSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`❌ 未找到站点地图: ${SITEMAP_PATH}`);
    return [];
  }
  const content = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const urls = [];
  const regex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1].trim();
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  return urls;
}

// 2. 向指定 IndexNow 端点发送 POST 请求
function submitToIndexNow(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(endpoint);
    const data = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'HuanqiuLadder-IndexNow-Submitter/1.0'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`请求超时 (${endpoint})`));
    });

    req.write(data);
    req.end();
  });
}

// 3. 执行推送任务
async function run() {
  console.log('🚀 开始向 IndexNow 协议提交站点地图 URL...');
  
  const urls = getUrlsFromSitemap();
  if (urls.length === 0) {
    console.warn('⚠️ 未检测到有效 URL，跳过 IndexNow 提交。');
    return;
  }

  console.log(`📦 从 sitemap.xml 成功提取 ${urls.length} 个页面 URL:`);
  urls.forEach((u, i) => console.log(`   [${i + 1}] ${u}`));

  const payload = {
    host: HOST,
    key: API_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 正在向 ${endpoint} 提交...`);
      const result = await submitToIndexNow(endpoint, payload);
      if (result.statusCode === 200 || result.statusCode === 202) {
        console.log(`✅ [${result.statusCode} ${result.statusMessage}] 提交成功！${result.statusCode === 202 ? '(已接受，等待密钥验证/处理)' : '(成功)'}`);
      } else {
        console.warn(`⚠️ [${result.statusCode} ${result.statusMessage}] 返回异常: ${result.body}`);
      }
    } catch (err) {
      console.error(`❌ [网络错误] 提交至 ${endpoint} 失败:`, err.message);
    }
  }

  console.log('\n🎉 IndexNow URL 提交流程执行完毕！\n');
}

if (require.main === module) {
  run();
}

module.exports = { run, getUrlsFromSitemap, submitToIndexNow, API_KEY };
