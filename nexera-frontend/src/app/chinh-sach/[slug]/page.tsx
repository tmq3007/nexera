import { PageHeader } from "@/components/layout/PageHeader";
import { getPolicyBySlug } from "@/utils/policies";
import { notFound } from "next/navigation";
import { Calendar, ShieldCheck } from "lucide-react";

function renderMarkdownContent(content: string) {
  // Normalize line breaks
  const normalized = content.replace(/\r\n/g, "\n");

  // Split into lines and process
  const lines = normalized.split("\n");
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let currentList: string[] = [];
  let elementIndex = 0;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ").trim();
      if (text) {
        elements.push(
          <p key={`p-${elementIndex++}`} className="text-gray-700 leading-relaxed">
            {text}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elementIndex++}`} className="list-disc pl-6 space-y-1.5 text-gray-700">
          {currentList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line → flush current block
    if (trimmed === "") {
      flushList();
      flushParagraph();
      continue;
    }

    // H1: # Heading
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      flushList();
      flushParagraph();
      elements.push(
        <h2 key={`h1-${elementIndex++}`} className="text-2xl font-bold text-[#13426E] mt-10 mb-4">
          {trimmed.replace(/^# /, "")}
        </h2>
      );
      continue;
    }

    // H2: ## Heading
    if (trimmed.startsWith("## ")) {
      flushList();
      flushParagraph();
      elements.push(
        <h3 key={`h2-${elementIndex++}`} className="text-xl font-bold text-[#13426E] mt-8 mb-3">
          {trimmed.replace(/^## /, "")}
        </h3>
      );
      continue;
    }

    // H3: ### Heading
    if (trimmed.startsWith("### ")) {
      flushList();
      flushParagraph();
      elements.push(
        <h4 key={`h3-${elementIndex++}`} className="text-lg font-semibold text-[#13426E] mt-6 mb-2">
          {trimmed.replace(/^### /, "")}
        </h4>
      );
      continue;
    }

    // List item: - text
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      currentList.push(trimmed.replace(/^[-*] /, ""));
      continue;
    }

    // Numbered list: 1. text, 2. text, etc (but NOT ## 2. which is heading)
    // These are kept as regular paragraphs with bold numbering for visual clarity
    // (no special handling needed since headings are already handled above)

    // Regular text → accumulate into paragraph
    flushList();
    currentParagraph.push(trimmed);
  }

  // Final flush
  flushList();
  flushParagraph();

  return elements;
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = await getPolicyBySlug(slug);

  if (!policy) {
    // Map fallback title if not in DB
    const policyTitles: Record<string, string> = {
      "bao-mat": "Chính Sách Bảo Mật Thông Tin",
      "van-chuyen": "Chính Sách Vận Chuyển & Giao Nhận",
      "doi-tra": "Chính Sách Đổi Trả & Hoàn Tiền",
      "thanh-toan": "Chính Sách Thanh Toán",
      "dieu-khoan": "Điều Khoản Sử Dụng Dịch Vụ",
    };

    const fallbackTitle = policyTitles[slug];
    if (!fallbackTitle) {
      notFound();
    }

    return (
      <>
        <PageHeader title={fallbackTitle} breadcrumb={`Chính sách / ${fallbackTitle}`} />
        <section className="py-16 bg-white min-h-[50vh]">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none text-gray-700">
              <h2 className="text-2xl font-bold text-[#13426E] mb-6">{fallbackTitle}</h2>
              <p className="mb-4">
                Nội dung chi tiết của <strong>{fallbackTitle}</strong> đang trong quá trình cập nhật và hoàn thiện để đảm bảo tuân thủ các quy định của Bộ Công Thương Việt Nam.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title={policy.title} breadcrumb={`Chính sách / ${policy.title}`} />

      <section className="py-16 bg-white min-h-[50vh]">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Metadata Header */}
          <div className="pb-6 mb-8 border-b border-gray-100">
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Hiệu lực từ: {new Date(policy.effective_from).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Policy Body Content */}
          <div className="prose prose-lg max-w-none space-y-4">
            {renderMarkdownContent(policy.content)}
          </div>

          {/* Ministry of Industry & Trade Notice */}
          <div className="mt-12 p-6 bg-[#F0F7FB] rounded-xl border-l-4 border-[#80BF49]">
            <h3 className="font-bold text-[#13426E] mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#80BF49]" />
              Cam kết tuân thủ Bộ Công Thương:
            </h3>
            <p className="text-sm text-gray-600">
              Nội dung chính sách này được đăng tải công khai nhằm đáp ứng quy định đăng ký website thương mại điện tử với Bộ Công Thương Việt Nam. Nexera cam kết thực hiện đúng các điều khoản đã công bố.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
