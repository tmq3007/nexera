"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, FolderKanban, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { contentApi } from "@/lib/api/content.api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProjectForm } from "./ProjectForm";
import { AdminPagination } from "./AdminPagination";
import { AdminFilterBar } from "./AdminFilterBar";
import { AdminTableToolbar } from "./AdminTableToolbar";
import { logActivity } from "@/lib/logger";

const categoryLabels: Record<string, { label: string; color: string }> = {
  INDUSTRIAL: { label: "Công nghiệp", color: "text-blue-600 font-medium" },
  RESIDENTIAL: { label: "Dân dụng", color: "text-emerald-600 font-medium" },
  SOLAR: { label: "Điện mặt trời", color: "text-amber-600 font-medium" },
};

export function ProjectManager({ 
  projects,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  projects: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper for URL pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLimitChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: any) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (project: any) => {
    setDeletingProject(project);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    
    const success = await contentApi.deleteProject(deletingProject.id);
    
    setIsDeleting(false);
    if (!success) {
      alert("Lỗi khi xoá dự án!");
    } else {
      logActivity({
        action: "DELETE_PROJECT",
        entity_type: "projects",
        entity_id: deletingProject.id,
        details: { name: deletingProject.name },
        severity: "WARNING",
      });
      setIsDeleteOpen(false);
      setDeletingProject(null);
      router.refresh();
    }
  };

  const [density, setDensity] = useState<"compact" | "normal">("compact");
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveCategoryFilter = Boolean(searchParams.get("category"));

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header Toolbar */}
      <AdminTableToolbar
        title="Dự án"
        totalCount={totalCount}
        subtitle="Quản lý danh sách dự án tiêu biểu"
        showFilterToggle={true}
        filterToggleLabel="Loại hình"
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        activeFiltersCount={hasActiveCategoryFilter ? 1 : 0}
        density={density}
        onDensityChange={setDensity}
        primaryAction={{
          label: "Thêm dự án",
          onClick: handleOpenAdd,
        }}
      />

      {/* Category Filter (collapsible) */}
      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200">
          <AdminFilterBar 
            filters={[
              {
                key: "category",
                label: "Mọi loại hình",
                type: "select",
                options: [
                  { label: "Công nghiệp", value: "INDUSTRIAL" },
                  { label: "Dân dụng", value: "RESIDENTIAL" },
                  { label: "Điện mặt trời", value: "SOLAR" }
                ]
              }
            ]}
          />
        </div>
      )}

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Tên dự án</th>
                <th className="px-3 py-2.5">Danh mục</th>
                <th className="px-3 py-2.5">Ngày hoàn thành</th>
                <th className="px-3 py-2.5 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!projects || projects.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                    <FolderKanban className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có dự án nào phù hợp bộ lọc. <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline font-semibold block mt-1">+ Thêm dự án đầu tiên</button></p>
                  </td>
                </tr>
              )}
              {projects?.map((project) => {
                const cat = categoryLabels[project.category] ?? categoryLabels.INDUSTRIAL;
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3 py-2" : "px-3 py-3";

                return (
                  <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2.5">
                        {project.image_url ? (
                          <img src={project.image_url} alt={project.name} className="w-10 h-8 rounded-md object-cover bg-gray-100 shrink-0 border border-gray-200/80 shadow-2xs" />
                        ) : (
                          <div className="w-10 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200/80"><FolderKanban className="w-3.5 h-3.5" /></div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-xs md:text-sm line-clamp-1">{project.name}</p>
                          {project.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 max-w-[280px] truncate">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={cellPadding}>
                      <span className={`text-xs ${cat.color}`}>{cat.label}</span>
                    </td>
                    <td className={`${cellPadding} text-gray-500 text-xs`}>
                      {project.completion_date ? (
                        <span>{new Date(project.completion_date).toLocaleDateString("vi-VN")}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(project)}
                          className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={handleLimitChange}
          totalItems={totalCount}
          totalPages={totalPages}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingProject ? "Chỉnh sửa dự án" : "Thêm dự án mới"}>
        <ProjectForm 
          initialData={editingProject} 
          onSuccess={() => {
            setIsFormOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xác nhận xoá"
        message={<span>Bạn có chắc chắn muốn xoá dự án <strong>{deletingProject?.name}</strong>? Hành động này không thể hoàn tác.</span>}
        loading={isDeleting}
        confirmText="Xoá dự án"
      />
    </div>
  );
}
