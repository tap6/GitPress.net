import type { Metadata } from "next";
import Link from "next/link";
import { CustomDomainHelp } from "@/components/CustomDomainHelp";

export const metadata: Metadata = {
  title: "用自己的域名访问博客",
  description:
    "多数人用一级域名（example.com）打开站点，二级、多级也可以。按 GitHub Pages、Vercel、Cloudflare 或其他托管查看步骤。",
};

export default function CustomDomainHelpPage() {
  return (
    <>
      <p className="mt-2">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← 全部帮助
        </Link>
      </p>
      <CustomDomainHelp />
    </>
  );
}
