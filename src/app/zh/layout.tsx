import type { Metadata } from "next";
import { pageMetadataZh } from "@/utils/seo";

export const metadata: Metadata = pageMetadataZh.home;

export default function ZhLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="zh-CN">
      {children}
    </div>
  );
} 