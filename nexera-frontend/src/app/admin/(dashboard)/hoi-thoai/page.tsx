export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { LiveChatManager } from "@/components/admin/LiveChatManager";

export default async function AdminLiveChatPage() {
  const supabase = await createClient();

  // Load initial conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, customer:customers(id, full_name, email, phone, phone_numbers, emails, address, tier)")
    .order("last_message_at", { ascending: false });

  return (
    <div className="h-full flex flex-col">
      <LiveChatManager initialConversations={conversations || []} />
    </div>
  );
}
