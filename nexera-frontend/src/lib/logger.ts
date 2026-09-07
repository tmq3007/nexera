import { createClient } from "@/utils/supabase/client";

export interface LogParams {
  action: string;
  entity_type: "products" | "orders" | "articles" | "leads" | "customers" | "roles" | "system" | string;
  entity_id?: string;
  details?: Record<string, any>;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  admin_id?: string;
  user_email?: string;
}

export async function logActivity({
  action,
  entity_type,
  entity_id,
  details = {},
  severity = "INFO",
  admin_id,
  user_email,
}: LogParams) {
  try {
    const supabase = createClient();

    let finalAdminId = admin_id;
    let finalUserEmail = user_email;

    if (!finalAdminId || !finalUserEmail) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (!finalUserEmail) finalUserEmail = user.email || user.user_metadata?.full_name || "Admin";
        
        if (!finalAdminId) {
          const { data: adminAccount } = await supabase
            .from("admin_accounts")
            .select("id, display_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (adminAccount) {
            finalAdminId = adminAccount.id;
            if (!user_email && adminAccount.display_name) {
              finalUserEmail = `${adminAccount.display_name} (${user.email || ""})`;
            }
          }
        }
      }
    }

    const { error } = await supabase.from("activity_logs").insert({
      admin_id: finalAdminId || null,
      user_email: finalUserEmail || "Hệ thống",
      action,
      entity_type,
      entity_id: entity_id || null,
      details,
      severity,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Lỗi khi lưu log hoạt động:", error.message);
    }
  } catch (err) {
    console.error("Logger error:", err);
  }
}
