import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface RiderProfile {
  id: string;
  name: string;
  name_ar: string;
  phone: string;
  area: string;
  vehicle: string;
  status: 'online' | 'offline' | 'on_delivery';
  total_deliveries: number;
  today_deliveries: number;
  rating: number;
  earnings: number;
  joined_date: string;
  created_at: string;
  email?: string;
}

export interface CreateRiderPayload {
  email: string;
  password: string;
  name: string;
  name_ar: string;
  phone: string;
  area: string;
  vehicle: string;
}

const supabase = getSupabaseClient();

export const riderService = {
  async fetchAll(): Promise<{ data: RiderProfile[] | null; error: string | null }> {
    const { data, error } = await supabase
      .from('riders')
      .select('*, user_profiles(email)')
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    const riders = (data || []).map((r: any) => ({
      ...r,
      email: r.user_profiles?.email || '',
    }));
    return { data: riders, error: null };
  },

  async fetchOwn(): Promise<{ data: RiderProfile | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: { ...data, email: user.email }, error: null };
  },

  async create(payload: CreateRiderPayload): Promise<{ data: RiderProfile | null; error: string | null }> {
    const { data, error } = await supabase.functions.invoke('manage-rider', {
      body: { action: 'create', ...payload },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          const parsed = JSON.parse(text || '{}');
          msg = parsed.error || text || msg;
        } catch {
          // ignore
        }
      }
      return { data: null, error: msg };
    }
    return { data: data.rider, error: null };
  },

  async update(riderId: string, updates: Partial<RiderProfile>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('riders')
      .update(updates)
      .eq('id', riderId);
    return { error: error?.message || null };
  },

  async delete(riderId: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase.functions.invoke('manage-rider', {
      body: { action: 'delete', riderId },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          const parsed = JSON.parse(text || '{}');
          msg = parsed.error || text || msg;
        } catch {
          // ignore
        }
      }
      return { error: msg };
    }
    return { error: null };
  },

  async updateStatus(riderId: string, status: RiderProfile['status']): Promise<{ error: string | null }> {
    const { error } = await supabase.from('riders').update({ status }).eq('id', riderId);
    return { error: error?.message || null };
  },
};
