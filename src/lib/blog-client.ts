// Format date for display (client-safe version)
export function formatDate(dateString: string, language: 'en' | 'zh' = 'en'): string {
  const date = new Date(dateString);
  
  if (language === 'zh') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
} 