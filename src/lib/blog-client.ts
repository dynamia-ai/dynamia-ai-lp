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

// Format reading time based on language
export function formatReadingTime(readingTime: string, language: 'en' | 'zh' = 'en'): string {
  // Extract minutes from reading time string (e.g., "5 min read" -> 5)
  const match = readingTime.match(/(\d+)/);
  if (!match) {
    return readingTime; // Return original if can't parse
  }
  
  const minutes = parseInt(match[1], 10);
  
  if (language === 'zh') {
    return `${minutes} 分钟阅读`;
  }
  
  // Return original English format
  return readingTime;
} 