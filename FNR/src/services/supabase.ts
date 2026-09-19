import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yizmvkfkgahyoqeznvki.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpem12a2ZrZ2FoeW9xZXpudmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjQ4NzIsImV4cCI6MjA3NTEwMDg3Mn0.cHeCjiv7NEPHO6EzU0hD2JaWFXEEFlYb532QBOkdZUA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);