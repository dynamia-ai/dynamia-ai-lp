/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://dynamia.ai',
  generateRobotsTxt: false, // 我们已经手动创建了优化的 robots.txt
  outDir: 'public',
  generateIndexSitemap: true,
  
  // 排除不需要索引的页面
  exclude: [
    '/admin/*', 
    '/private/*', 
    '/api/*', 
    '/server-sitemap.xml',
    '/_next/*',
    '/temp/*',
    '/test/*',
    '/404',
    '/500'
  ],
  
  // 额外的站点地图路径
  additionalPaths: async (config) => [
    await config.transform(config, '/sitemap-products.xml'),
    await config.transform(config, '/sitemap-blog.xml'),
    await config.transform(config, '/sitemap-resources.xml'),
  ],

  // 配置不同路由的变更频率和优先级
  transform: async (config, path) => {
    // Default settings
    let changefreq = 'weekly';
    let priority = 0.7;

    // Homepage gets highest priority
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    }
    // Main pages get high priority
    else if (['/products', '/pricing', '/company'].includes(path)) {
      priority = 0.9;
      changefreq = 'weekly';
    }
    // Blog and case studies get medium-high priority
    else if (path.startsWith('/blog/') || path.startsWith('/resources/')) {
      priority = 0.8;
      changefreq = 'monthly';
    }
    // Chinese pages get same priority as English
    else if (path.startsWith('/zh/')) {
      const englishPath = path.replace('/zh', '');
      if (englishPath === '/') {
        priority = 1.0;
        changefreq = 'daily';
      } else if (['/products', '/pricing', '/company'].includes(englishPath)) {
        priority = 0.9;
        changefreq = 'weekly';
      } else {
        priority = 0.7;
        changefreq = 'weekly';
      }
    }
    // Other pages get default priority
    else {
      priority = 0.6;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  // Optional: 配置 robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/private', '/api'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
    ],
    additionalSitemaps: [
      // Add additional sitemaps here if needed
    ],
  },
  // Optional: 生成 sitemap 的配置
  generateIndexSitemap: true,
  autoLastmod: true,
}