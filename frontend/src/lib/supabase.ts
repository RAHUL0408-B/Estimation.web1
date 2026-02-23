import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgrxmhvowawznojdggnl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_qkAxjLVjGHpFGwPuZ93X0g_4VTJyZ6a';

export const supabase = createClient(supabaseUrl, supabaseKey);
