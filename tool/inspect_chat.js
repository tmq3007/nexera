const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kfjzrzetgeslulzofniv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmanpyemV0Z2VzbHVsem9mbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTY4NTAsImV4cCI6MjEwMzA5Mjg1MH0.ICA1y0ieYODzrfhMJI4KCXmyxU5Wjm-mpOsJKYlMwWU'
);

async function inspect() {
  const { data: convs, error: cErr } = await supabase
    .from('conversations')
    .select('id, guest_session_id, customer_id, guest_name, status, last_message_preview, last_message_at')
    .order('created_at', { ascending: false });

  console.log('Conversations count:', convs?.length);
  console.log('Conversations:', JSON.stringify(convs, null, 2));

  const { data: msgs, error: mErr } = await supabase
    .from('chat_messages')
    .select('id, conversation_id, sender_type, sender_name, content')
    .order('created_at', { ascending: false })
    .limit(15);

  console.log('Recent 15 messages:', JSON.stringify(msgs, null, 2));
}

inspect().catch(console.error);
