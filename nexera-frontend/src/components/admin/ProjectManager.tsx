"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, FolderKanban, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ProjectForm } from "./ProjectForm";

const categoryLabels: Record<string, { label: string; color: string }> = {
  INDUSTRIAL: { label: "Công nghiệp", color: "bg-blue-100 text-blue-700" },
  RESIDENTIAL: { label: "Dân dụng", color: "bg-green-100 text-green-700" },
  SOLAR: { label: "Điện mặt trời", color: "bg-yellow-100 text-yellow-700" },
};

export function ProjectManager({ projects }: { projects: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    const { error } = await supabase.from("projects").delete().eq("id", deletingProject.id);
    
    setIsDeleting(false);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
    } else {
      setIsDeleteOpen(false);
      setDeletingProject(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dự án</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý danh sách dự án tiêu biểu</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm dự án
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Tên dự án</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Danh mục</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Ngày hoàn thành</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!projects || projects.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có dự án nào. <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline">Thêm dự án đầu tiên</button></p>
                  </td>
                </tr>
              )}
              {projects?.map((project) => {
                const cat = categoryLabels[project.category] ?? categoryLabels.INDUSTRIAL;
                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {project.image_url ? (
                          <img src={project.image_url} alt={project.name} className="w-12 h-8 rounded object-cover bg-gray-100" />
                        ) : (
                          <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400"><FolderKanban className="w-4 h-4" /></div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-[300px] truncate">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>{cat.label}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {project.completion_date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(project.completion_date).toLocaleDateString("vi-VN")}
                        </span>
                      ) : (
                        <span className="text-gray-300">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(project)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </>
  );
}
