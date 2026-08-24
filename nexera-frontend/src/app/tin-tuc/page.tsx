import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Calendar, User } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function NewsPage(props: { searchParams: Promise<{ page?: string, type?: string }> }) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;
  
  // Setup params
  const page = parseInt(searchParams.page || "1", 10);
  const typeFilter = searchParams.type || null;
  const limit = 6;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build query
  let query = supabase
    .from("articles")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false });

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  // Fetch paginated data and total count
  const { data: news, count } = await query.range(from, to);
    
  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <>
      <PageHeader title="Tin Tức & Truyền Thông" breadcrumb="Tin tức" />

      <section className="py-16 bg-[#F0F7FB] min-h-[600px]">
        <div className="container mx-auto px-4">
          
          {/* Categories Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link 
              href="/tin-tuc" 
              scroll={false}
              className={`px-6 py-2 rounded-full font-medium transition-colors shadow-sm ${
                !typeFilter ? "bg-[#13426E] text-white" : "bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white"
              }`}
            >
              Tất cả
            </Link>
            <Link 
              href="/tin-tuc?type=NEXERA" 
              scroll={false}
              className={`px-6 py-2 rounded-full font-medium transition-colors shadow-sm ${
                typeFilter === "NEXERA" ? "bg-[#13426E] text-white" : "bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white"
              }`}
            >
              Tin tức Nexera
            </Link>
            <Link 
              href="/tin-tuc?type=ENERGY" 
              scroll={false}
              className={`px-6 py-2 rounded-full font-medium transition-colors shadow-sm ${
                typeFilter === "ENERGY" ? "bg-[#13426E] text-white" : "bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white"
              }`}
            >
              Tin tức Năng lượng
            </Link>
            <Link 
              href="/tin-tuc?type=EXPERIENCE" 
              scroll={false}
              className={`px-6 py-2 rounded-full font-medium transition-colors shadow-sm ${
                typeFilter === "EXPERIENCE" ? "bg-[#13426E] text-white" : "bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white"
              }`}
            >
              Kinh nghiệm hay
            </Link>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news?.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group flex flex-col">
                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                  <Image src={item.image_url || "/doi.png"} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-[#80BF49] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {item.type === 'NEXERA' ? 'Nexera' : item.type === 'ENERGY' ? 'Năng Lượng' : item.type === 'EXPERIENCE' ? 'Kinh Nghiệm' : 'Tin Tức'}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.published_at || item.created_at).toLocaleDateString("vi-VN")}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Admin</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#13426E] mb-3 group-hover:text-[#80BF49] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-3 mb-6 flex-1">
                    {item.content}
                  </p>
                  <Link href={`/tin-tuc/${item.id}`} className="inline-flex items-center gap-2 text-[#13426E] font-bold hover:text-[#80BF49] transition-colors mt-auto">
                    Đọc tiếp <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
            
            {(!news || news.length === 0) && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Không có bài viết nào thuộc danh mục này.
              </div>
            )}
          </div>

          {/* Dynamic Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <Link 
                    key={p}
                    href={`/tin-tuc?page=${p}${typeFilter ? `&type=${typeFilter}` : ''}`}
                    scroll={false}
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold shadow-sm transition-colors ${
                      p === page 
                        ? "bg-[#13426E] text-white" 
                        : "bg-white text-[#13426E] hover:bg-[#80BF49] hover:text-white"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </section>
    </>
  );
}
