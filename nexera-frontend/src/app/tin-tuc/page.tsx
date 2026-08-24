import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Calendar, User } from "lucide-react";

export default function NewsPage() {
  const news = [
    {
      id: 1,
      title: "Cú hích lớn để phát triển điện mặt trời mái nhà tại Việt Nam",
      excerpt: "Ngày 26/6/2026, Chính phủ đã ban hành Nghị định số 243/2026/NĐ-CP, bổ sung một số chính sách khuyến khích phát triển điện mặt trời, tạo điều kiện thuận lợi cho người dân và doanh nghiệp.",
      date: "15/08/2026",
      author: "Admin",
      category: "Tin tức Năng lượng"
    },
    {
      id: 2,
      title: "Nexera Solar hoàn thành dự án 3.2 MWp tại Khu công nghiệp VSIP",
      excerpt: "Dự án điện mặt trời áp mái với tổng công suất 3.2 MWp đã chính thức đóng điện và bàn giao cho chủ đầu tư tại KCN VSIP, giúp doanh nghiệp tiết kiệm hàng tỷ đồng mỗi năm.",
      date: "10/08/2026",
      author: "Nexera PR",
      category: "Tin tức Nexera"
    },
    {
      id: 3,
      title: "Giải pháp lưu trữ năng lượng BESS: Xu hướng tất yếu của tương lai",
      excerpt: "Hệ thống lưu trữ năng lượng pin (BESS) đang trở thành giải pháp tối ưu để giải quyết bài toán thiếu hụt năng lượng và ổn định lưới điện trong giờ cao điểm.",
      date: "05/08/2026",
      author: "Admin",
      category: "Kinh nghiệm hay"
    },
    {
      id: 4,
      title: "Kinh nghiệm vệ sinh và bảo dưỡng tấm pin mặt trời mùa mưa bão",
      excerpt: "Mùa mưa bão đến mang theo nhiều rủi ro cho hệ thống điện mặt trời. Hướng dẫn chi tiết cách bảo dưỡng, chằng chống và vệ sinh để đảm bảo an toàn, duy trì hiệu suất.",
      date: "01/08/2026",
      author: "Kỹ thuật viên",
      category: "Kinh nghiệm hay"
    },
    {
      id: 5,
      title: "Xu hướng phát triển Nông nghiệp công nghệ cao kết hợp năng lượng tái tạo",
      excerpt: "Mô hình Smart Farm kết hợp điện mặt trời không chỉ giúp tiết kiệm không gian mà còn mang lại lợi ích kép về kinh tế và môi trường cho bà con nông dân.",
      date: "25/07/2026",
      author: "Nexera PR",
      category: "Tin tức Năng lượng"
    },
    {
      id: 6,
      title: "Chương trình ưu đãi giảm 10% gói lắp đặt điện mặt trời hộ gia đình",
      excerpt: "Nhân dịp kỷ niệm 5 năm thành lập, Nexera Solar tung ra gói ưu đãi đặc biệt dành riêng cho khách hàng hộ gia đình đăng ký lắp đặt trong tháng này.",
      date: "20/07/2026",
      author: "Admin",
      category: "Tin tức Nexera"
    }
  ];

  return (
    <>
      <PageHeader title="Tin Tức & Truyền Thông" breadcrumb="Tin tức" />

      <section className="py-16 bg-[#F0F7FB]">
        <div className="container mx-auto px-4">
          
          {/* Categories Filter (Visual only) */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button className="px-6 py-2 bg-[#13426E] text-white rounded-full font-medium">Tất cả</button>
            <button className="px-6 py-2 bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white transition-colors rounded-full font-medium shadow-sm">Tin tức Nexera</button>
            <button className="px-6 py-2 bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white transition-colors rounded-full font-medium shadow-sm">Tin tức Năng lượng</button>
            <button className="px-6 py-2 bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white transition-colors rounded-full font-medium shadow-sm">Kinh nghiệm hay</button>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group flex flex-col">
                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                  <Image src="/doi.png" alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-[#80BF49] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {item.category}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.author}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#13426E] mb-3 group-hover:text-[#80BF49] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-3 mb-6 flex-1">
                    {item.excerpt}
                  </p>
                  <Link href={`/tin-tuc/${item.id}`} className="inline-flex items-center gap-2 text-[#13426E] font-bold hover:text-[#80BF49] transition-colors mt-auto">
                    Đọc tiếp <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12 gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#13426E] text-white font-bold">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white transition-colors font-bold shadow-sm">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white transition-colors font-bold shadow-sm">3</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white transition-colors shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </section>
    </>
  );
}
