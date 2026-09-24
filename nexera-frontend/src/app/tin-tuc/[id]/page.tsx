import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Calendar, User, Tag } from "lucide-react";
import { contentApi } from "@/lib/api/content.api";

export default async function NewsDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const article = await contentApi.getArticle(id);

  if (!article) {
    return (
      <>
        <PageHeader title="Chi Tiết Tin Tức" breadcrumb="Tin tức" />
        <div className="py-20 bg-[#F0F7FB] min-h-[500px] flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#13426E] mb-4">
              Không tìm thấy bài viết
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm sm:text-base">
              Bài viết bạn đang tìm kiếm có thể đã được gỡ bỏ hoặc liên kết không chính xác.
            </p>
            <Link
              href="/tin-tuc"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#13426E] hover:bg-[#80BF49] text-white rounded-xl font-semibold transition-colors shadow-sm text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại danh sách tin tức
            </Link>
          </div>
        </div>
      </>
    );
  }

  const categoryLabel =
    article.type === "NEXERA"
      ? "Tin tức Nexera"
      : article.type === "ENERGY"
      ? "Năng lượng xanh"
      : article.type === "EXPERIENCE"
      ? "Kinh nghiệm hay"
      : "Tin tức";

  return (
    <>
      <PageHeader title={article.title} breadcrumb="Tin tức" />

      <article className="py-10 md:py-16 bg-[#F0F7FB] min-h-[600px]">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/tin-tuc"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#13426E] hover:text-[#80BF49] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại danh sách tin tức
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 shadow-md border border-gray-100">
            {/* Meta tags & Category */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5 bg-[#80BF49]/15 text-[#5e962f] font-bold px-3 py-1 rounded-full uppercase text-xs">
                <Tag className="w-3 h-3" /> {categoryLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {new Date(article.published_at || article.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" /> Ban biên tập Nexera
              </span>
            </div>

            {/* Article Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#13426E] leading-tight mb-6 sm:mb-8">
              {article.title}
            </h1>

            {/* Featured Image */}
            <div className="relative aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 mb-8 sm:mb-10 shadow-sm">
              <Image
                src={article.image_url || "/doi.png"}
                alt={article.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Article Body Content */}
            <div className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed space-y-5">
              {article.content?.split("\n\n").map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              )) || <p>{article.content}</p>}
            </div>

            {/* Footer Navigation */}
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                Xuất bản bởi Công ty Cổ phần Giải pháp Năng lượng Nexera
              </span>
              <Link
                href="/tin-tuc"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-[#13426E] hover:text-white text-gray-700 rounded-xl font-semibold transition-all text-xs sm:text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Về trang tin tức
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
