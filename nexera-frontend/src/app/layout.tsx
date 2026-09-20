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
  title: "NEXERA | Năng lượng xanh - vì tương lai bền vững",
  description:
    "NEXERA - Năng lượng xanh - vì tương lai bền vững. Cung cấp các thiết bị và giải pháp điện mặt trời, năng lượng tái tạo hàng đầu Việt Nam.",
  icons: {
    icon: "/Symbol.png",
    apple: "/Symbol.png",
  },
  openGraph: {
    title: "NEXERA | Năng lượng xanh - vì tương lai bền vững",
    description: "NEXERA - Năng lượng xanh - vì tương lai bền vững.",
    url: "https://nexera.vn",
    siteName: "NEXERA",
    images: [
      {
        url: "/Logo-slogan.png",
        width: 1200,
        height: 630,
        alt: "NEXERA | Năng lượng xanh - vì tương lai bền vững",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXERA | Năng lượng xanh - vì tương lai bền vững",
    description: "NEXERA - Năng lượng xanh - vì tương lai bền vững.",
    images: ["/Logo-slogan.png"],
  },
  other: {
    "color-scheme": "only light",
  },
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
      style={{ colorScheme: "only light" }}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-[#13426E]">
        <ToastProvider>
          <StorefrontShell>{children}</StorefrontShell>
        </ToastProvider>
      </body>
    </html>
  );
}

