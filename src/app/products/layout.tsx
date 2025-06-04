import type { Metadata } from "next";
import { pageMetadata } from "@/utils/seo";

export const metadata: Metadata = pageMetadata.products;

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 