/**
 * Validates if an email is a company email (not a common personal email)
 */
export function isCompanyEmail(email: string): boolean {
  // 常见个人邮箱域名列表
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'qq.com', '163.com', '126.com', 'foxmail.com', 
    'sina.com', 'sohu.com', '139.com', 'yeah.net',
    'icloud.com', 'me.com', 'protonmail.com', 'live.com',
    'mail.com', 'yandex.com', 'aol.com', 'inbox.com',
    'zoho.com', 'gmx.com', 'msn.com'
  ];
  
  // 获取邮箱的域名部分
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const domain = parts[1].toLowerCase();
  
  // 检查是否在个人邮箱列表中
  return !personalDomains.includes(domain);
} 