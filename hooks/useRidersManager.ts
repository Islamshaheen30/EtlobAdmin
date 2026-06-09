import { useState, useCallback } from 'react';
import { riderService, RiderProfile, CreateRiderPayload } from '@/services/riderService';

export function useRidersManager() {
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await riderService.fetchAll();
    if (err) setError(err);
    else setRiders(data || []);
    setLoading(false);
  }, []);

  const createRider = useCallback(async (payload: CreateRiderPayload): Promise<{ error: string | null }> => {
    const { data, error: err } = await riderService.create(payload);
    if (err) return { error: err };
    if (data) setRiders(prev => [{ ...data, email: payload.email }, ...prev]);
    return { error: null };
  }, []);

  const updateRider = useCallback(async (riderId: string, updates: Partial<RiderProfile>): Promise<{ error: string | null }> => {
    const { error: err } = await riderService.update(riderId, updates);
    if (err) return { error: err };
    setRiders(prev => prev.map(r => r.id === riderId ? { ...r, ...updates } : r));
    return { error: null };
  }, []);

  const deleteRider = useCallback(async (riderId: string): Promise<{ error: string | null }> => {
    const { error: err } = await riderService.delete(riderId);
    if (err) return { error: err };
    setRiders(prev => prev.filter(r => r.id !== riderId));
    return { error: null };
  }, []);

  return { riders, loading, error, loadRiders, createRider, updateRider, deleteRider };
}
