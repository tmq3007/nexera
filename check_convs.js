async function main() {
  const url = 'https://kfjzrzetgeslulzofniv.supabase.co/rest/v1/conversations?select=id,customer_id,guest_session_id,guest_email,status,created_at,last_message_at';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmanpyemV0Z2VzbHVsem9mbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTY4NTAsImV4cCI6MjEwMzA5Mjg1MH0.ICA1y0ieYODzrfhMJI4KCXmyxU5Wjm-mpOsJKYlMwWU';
  
  const res = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    }
  });
  const convs = await res.json();
  console.log('Total convs:', convs.length);

  for (const c of convs) {
    const msgRes = await fetch(`https://kfjzrzetgeslulzofniv.supabase.co/rest/v1/chat_messages?conversation_id=eq.${c.id}&select=id`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact'
      }
    });
    const contentRange = msgRes.headers.get('content-range');
    const count = contentRange ? contentRange.split('/')[1] : '0';
    if (parseInt(count) > 0 || c.status !== 'MERGED') {
      console.log(`Conv ${c.id}: status=${c.status}, cust=${c.customer_id}, session=${c.guest_session_id}, email=${c.guest_email}, msg_count=${count}, created=${c.created_at}`);
    }
  }
}
main();
