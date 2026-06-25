
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-client';
import { Database } from './supabase_types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
