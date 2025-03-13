require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const algoliasearch = require('algoliasearch');

// Algolia 客户端配置
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

// 检查环境变量
if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error('错误: 请在 .env.local 文件中设置所有必要的 Algolia 环境变量');
  process.exit(1);
}

// 创建 Algolia 客户端和索引
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

// 从 Next.js 页面抓取内容 (这只是一个简单的示例，实际情况会更复杂)
async function extractContentFromPages() {
  const appDir = path.join(__dirname, '../src/app');
  const records = [];
  
  // 处理单个页面
  async function processPage(filePath, locale = 'en') {
    const relativePath = path.relative(appDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 简单地查找页面标题 (实际使用可能需要更复杂的解析)
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/s) || 
                      content.match(/title="(.*?)"/s) ||
                      content.match(/className="text-3xl[^>]*>(.*?)<\/\w+>/s);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : path.basename(filePath, '.tsx');
    
    // 提取文本内容 (简化版)
    const textContent = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // 限制长度
    
    // 确定页面 URL 路径
    let urlPath = '/' + relativePath.replace(/\\/g, '/').replace(/\.tsx$/, '');
    if (urlPath.endsWith('/page')) {
      urlPath = urlPath.replace(/\/page$/, '/');
    }
    if (urlPath === '/page') {
      urlPath = '/';
    }
    
    if (locale === 'zh') {
      urlPath = `/zh${urlPath}`;
    }
    
    return {
      objectID: `${locale}_${relativePath}`,
      title,
      content: textContent,
      path: urlPath,
      locale,
    };
  }
  
  // 递归处理目录
  async function processDirectory(dirPath, locale) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 检查是否是语言目录
        if (entry.name === 'zh') {
          await processDirectory(fullPath, 'zh');
        } else {
          await processDirectory(fullPath, locale);
        }
      } else if (entry.name === 'page.tsx') {
        const record = await processPage(fullPath, locale);
        records.push(record);
      }
    }
  }
  
  // 开始处理
  await processDirectory(appDir, 'en');
  
  return records;
}

// 主函数
async function main() {
  try {
    console.log('开始抓取页面内容...');
    const records = await extractContentFromPages();
    
    console.log(`找到 ${records.length} 个页面`);
    
    // 设置索引配置
    await index.setSettings({
      searchableAttributes: ['title', 'content'],
      attributesToSnippet: ['content:50'],
      attributesForFaceting: ['locale'],
    });
    
    // 上传记录到 Algolia
    if (records.length > 0) {
      console.log('正在上传记录到 Algolia...');
      await index.saveObjects(records);
      console.log('所有记录已成功上传到 Algolia!');
    } else {
      console.log('没有找到可索引的内容。');
    }
    
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

main(); 