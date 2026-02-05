// ===================================
// Supabase Configuration
// ===================================

const SUPABASE_URL = 'https://ovaryjmtpfmacxhlsajx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92YXJ5am10cGZtYWN4aGxzYWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDg1NDcsImV4cCI6MjA4MTAyNDU0N30.9giPPG0zqkq5dK_EQ5judF1YsMJMcZmQ98uAQJq-Mbo';

window.supabaseJs = window.supabase;
window.supabase = window.supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
