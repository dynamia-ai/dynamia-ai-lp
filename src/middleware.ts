import { NextRequest, NextResponse } from 'next/server';

// 支持的语言
export const locales = ['en', 'zh'];
export const defaultLocale = 'en';

// 获取请求中的locale
function getLocale(request: NextRequest) {
  // 从路径中提取locale
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameLocale) return pathnameLocale;
  
  // 从cookie中获取locale
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;
  
  // 从Accept-Language头获取locale
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const parsedLocales = acceptLanguage.split(',')
      .map(l => l.split(';')[0].trim())
      .filter(l => locales.some(locale => l.startsWith(locale)));
    
    if (parsedLocales.length > 0) {
      return parsedLocales[0].substring(0, 2);
    }
  }
  
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 排除不需要处理的路径
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // 获取locale
  const locale = getLocale(request);
  
  // 检查是否已经有locale前缀
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameHasLocale) return NextResponse.next();
  
  // 如果是默认locale且没有前缀，不重定向
  if (locale === defaultLocale) return NextResponse.next();
  
  // 重定向到带有locale前缀的路由
  const newUrl = new URL(
    `/${locale}${pathname === '/' ? '' : pathname}`,
    request.url
  );
  
  return NextResponse.redirect(newUrl);
}

// 在文件末尾添加config导出
export const config = {
  matcher: [
    // 匹配所有路径，但排除以下路径
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}; 