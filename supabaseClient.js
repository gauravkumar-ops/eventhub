// supabaseClient.js
const SUPABASE_URL = 'https://rishavddjjltzcifuxqo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y54FQMl0uAcmh7W0DtP6gg__eK8Bbx1';

// Initializes the client from the Supabase CDN script (window.supabase)
const db = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Expose globally to window
if (typeof window !== 'undefined') {
  window.db = db;
  window.supabaseClient = db;
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
}
