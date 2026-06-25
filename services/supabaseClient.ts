
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase_types';

const supabaseUrl = 'https://lqnnlcukvwrntkubtwtd.supabase.co';
const supabaseAnonKey = 'sb_publishable_OsJlUIdSD0nht54p7f_lDA_rxgABgsP';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
