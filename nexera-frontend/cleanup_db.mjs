import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2].trim();
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching conversations to delete...");
  
  // Find conversations that have messages like "Tư vấn điện mặt trời..." or where guest_name is Admin
  const { data: msgs, error: msgErr } = await supabase
    .from('chat_messages')
    .select('conversation_id, content');
    
  if (msgErr) {
    console.error("Error fetching messages:", msgErr);
    return;
  }
  
  const badConvIds = new Set();
  for (const m of msgs) {
    if (m.content && (m.content.includes("Tư vấn") || m.content.includes("Báo giá"))) {
      badConvIds.add(m.conversation_id);
    }
  }
  
  console.log(`Found ${badConvIds.size} fake conversations based on message content.`);
  
  for (const cid of badConvIds) {
    console.log(`Deleting conversation ${cid}...`);
    // Delete messages first
    await supabase.from('chat_messages').delete().eq('conversation_id', cid);
    await supabase.from('conversations').delete().eq('id', cid);
  }
  
  // Xóa luôn các session chưa có tin nhắn nhưng có guest_name chứa "Quản trị viên"
  const { data: adminConvs } = await supabase
    .from('conversations')
    .select('id, guest_name')
    .ilike('guest_name', '%Quản trị viên%');
    
  if (adminConvs && adminConvs.length > 0) {
    console.log(`Found ${adminConvs.length} empty admin conversations. Deleting...`);
    for (const c of adminConvs) {
      await supabase.from('chat_messages').delete().eq('conversation_id', c.id);
      await supabase.from('conversations').delete().eq('id', c.id);
    }
  }

  console.log("Cleanup complete!");
}

run();
