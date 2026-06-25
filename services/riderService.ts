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
      .from('drivers')
      .select(`
        id,
        user_id,
        vehicle_type,
        is_online,
        created_at,
        users!drivers_user_id_fkey(
          id,
          phone_number,
          raw_app_meta_data
        )
      `)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    // Map drivers to RiderProfile format
    const mapped = (data || []).map((d: any) => ({
      id: d.id,
      name: d.users?.raw_app_meta_data?.name || 'مندوب',
      name_ar: d.users?.raw_app_meta_data?.name_ar || 'مندوب',
      phone: d.users?.phone_number || '',
      area: d.users?.raw_app_meta_data?.area || 'Cairo',
      vehicle: d.vehicle_type || 'bicycle',
      status: d.is_online ? 'online' : 'offline',
      total_deliveries: d.users?.raw_app_meta_data?.total_deliveries || 0,
      today_deliveries: d.users?.raw_app_meta_data?.today_deliveries || 0,
      rating: d.users?.raw_app_meta_data?.rating || 4.5,
      earnings: d.users?.raw_app_meta_data?.earnings || 0,
      joined_date: d.created_at,
      created_at: d.created_at,
      email: d.users?.raw_app_meta_data?.email,
    }));

    return { data: mapped, error: null };
  },

  async fetchOwn(): Promise<{ data: RiderProfile | null; error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return {
      data: {
        id: data.id,
        name: 'مندوب',
        name_ar: 'مندوب',
        phone: user.phone || '',
        area: 'Cairo',
        vehicle: data.vehicle_type || 'bicycle',
        status: data.is_online ? 'online' : 'offline',
        total_deliveries: 0,
        today_deliveries: 0,
        rating: 4.5,
        earnings: 0,
        joined_date: data.created_at,
        created_at: data.created_at,
        email: user.email,
      },
      error: null,
    };
  },

  async create(payload: CreateRiderPayload): Promise<{ data: RiderProfile | null; error: string | null }> {
    // Using direct DB insert to leverage the SQL triggers we created
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        name: payload.name,
        phone: payload.phone,
        vehicle_type: payload.vehicle, // Mapping vehicle to vehicle_type
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async update(riderId: string, updates: Partial<RiderProfile>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('drivers')
      .update({
        vehicle_type: updates.vehicle,
        is_online: updates.status === 'online',
      })
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
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: status === 'online' })
      .eq('id', riderId);
    return { error: error?.message || null };
  },
};

