import { createClient } from "@/utils/supabase/server";
import { ProjectManager } from "@/components/admin/ProjectManager";

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return <ProjectManager projects={projects || []} />;
}

