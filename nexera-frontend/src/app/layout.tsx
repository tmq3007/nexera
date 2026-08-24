import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "NEXERA | Hệ sinh thái Giải pháp Tích hợp",
  description:
    "NEXERA - Công nghệ thông minh, Năng lượng xanh, Tương lai bền vững. Cung cấp giải pháp tích hợp cho chuyển đổi số, chuyển đổi xanh và phát triển bền vững.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-[#13426E]">
        <ToastProvider>
          <StorefrontShell>{children}</StorefrontShell>
        </ToastProvider>
      </body>
    </html>
  );
}

