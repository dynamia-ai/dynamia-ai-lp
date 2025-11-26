import { getAllBlogPosts, getAllTagsFromPosts } from '@/lib/blog-server';
import BlogListClient from './BlogListClient';

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  
  // 获取两种语言的博客文章
  const enPosts = getAllBlogPosts('en');
  const zhPosts = getAllBlogPosts('zh');
  
  // 从已加载的文章中提取标签
  const enTags = getAllTagsFromPosts(enPosts);
  const zhTags = getAllTagsFromPosts(zhPosts);

  return (
    <BlogListClient 
      enPosts={enPosts} 
      zhPosts={zhPosts}
      enTags={enTags}
      zhTags={zhTags}
      selectedTag={tag}
    />
  );
} 