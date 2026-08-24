import { PageHeader } from "@/components/layout/PageHeader";

// This is a dynamic placeholder page for all policies required by Bộ Công Thương
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Map slug to title
  const policyTitles: Record<string, string> = {
    "bao-mat": "Chính Sách Bảo Mật Thông Tin",
    "van-chuyen": "Chính Sách Vận Chuyển & Giao Nhận",
    "doi-tra": "Chính Sách Đổi Trả & Hoàn Tiền",
    "thanh-toan": "Chính Sách Thanh Toán",
    "dieu-khoan": "Điều Khoản Sử Dụng Dịch Vụ",
  };

  const title = policyTitles[slug] || "Chính Sách Công Ty";

  return (
    <>
      <PageHeader title={title} breadcrumb={`Chính sách / ${title}`} />

      <section className="py-16 bg-white min-h-[50vh]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none text-gray-700">
            <h2 className="text-2xl font-bold text-[#13426E] mb-6">{title}</h2>
            <p className="mb-4">
              Nội dung chi tiết của <strong>{title}</strong> đang trong quá trình cập nhật và hoàn thiện để đảm bảo tuân thủ các quy định của Bộ Công Thương Việt Nam.
            </p>
            <p>
              Vui lòng quay lại sau hoặc liên hệ với chúng tôi qua số điện thoại/email để được hỗ trợ trực tiếp.
            </p>
            <div className="mt-12 p-6 bg-[#F0F7FB] rounded-xl border-l-4 border-[#80BF49]">
              <h3 className="font-bold text-[#13426E] mb-2">Thông báo:</h3>
              <p className="text-sm">Trang này được tạo ra nhằm mục đích đáp ứng yêu cầu công khai chính sách trên website theo quy định đăng ký website thương mại điện tử với Bộ Công Thương.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
