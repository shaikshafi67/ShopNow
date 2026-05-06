import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ptgnbqriunandgwgtvdf.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z25icXJpdW5hbmRnd2d0dmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTg0MzEsImV4cCI6MjA5MzYzNDQzMX0.JSBTkxZQMLPyH33Ofrfu8BlEXqCq723q9C1VpJv71uk';

export const supabase = createClient(url, key);
