import { createClient } from "@/utils/supabase/client";
import { analyticsApi } from "@/lib/api/analytics.api";

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
    const finalAdminId = admin_id;
    let finalUserEmail = user_email;

    const supabase = createClient();

    if (!finalAdminId || !finalUserEmail) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (!finalUserEmail) finalUserEmail = user.email || user.user_metadata?.full_name || "Admin";
      }
    }

    const sev = severity === "ERROR" ? "CRITICAL" : severity;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await analyticsApi.logActivity({
      userId: finalAdminId,
      userEmail: finalUserEmail || "Hệ thống",
      action,
      entityType: entity_type,
      entityId: entity_id,
      details,
      severity: sev as "INFO" | "WARNING" | "CRITICAL",
    }, token);
  } catch (err) {
    console.error("Logger error:", err);
  }
}

