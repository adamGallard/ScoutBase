import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfkehgmgquhkjvehesby.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2VoZ21ncXVoa2p2ZWhlc2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTI3OTgsImV4cCI6MjA1OTE2ODc5OH0.GwF7I0RxEtFg6KCGYIGmlGI0HrFpDp4AfrDBt1Q-B20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
