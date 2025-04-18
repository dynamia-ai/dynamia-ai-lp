/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://dynamia.ai',
  generateRobotsTxt: true,
  // Optional: 更改 sitemap 的默认输出目录
  outDir: 'public',
  // Optional: 排除特定路径
  exclude: ['/admin/*', '/private/*'],
  // Optional: 配置 robots.txt
  robotsTxtOptions: {
    additionalSitemaps: [
      // 如果有额外的 sitemap 可以在这里添加
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
  // Optional: 生成 sitemap 的配置
  generateIndexSitemap: true,
} 