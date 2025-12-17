import { useState, useEffect, useCallback } from 'react';
import {
  PengaturanPernikahan,
  UpdatePengaturanPernikahanInput,
} from '../../types/PengaturanPernikahan.types';
import PengaturanPernikahanAPI from '../../services/PengaturanPernikahanAPI';

export const usePengaturanPernikahan = () => {
  const [pengaturan, setPengaturan] = useState<PengaturanPernikahan | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<PengaturanPernikahanAPI | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const apiInstance = new PengaturanPernikahanAPI();
      setApi(apiInstance);
    } catch (err: any) {
      console.error('Failed to initialize PengaturanPernikahanAPI:', err);
      setError(err.message || 'Gagal menginisialisasi API');
    }
  }, []);

  const fetchPengaturan = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const data = await api.get();
      setPengaturan(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching pengaturan:', err);
      setError(err.message || 'Gagal memuat pengaturan pernikahan');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updatePengaturan = async (input: UpdatePengaturanPernikahanInput) => {
    if (!api || !pengaturan) throw new Error('API atau data belum siap');
    try {
      setLoading(true);
      const updatedData = await api.update(pengaturan.id, input);
      setPengaturan(updatedData);
      setError(null);
      return updatedData;
    } catch (err: any) {
      console.error('Error updating pengaturan:', err);
      setError(err.message || 'Gagal memperbarui pengaturan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api && isClient) {
      fetchPengaturan();
    }
  }, [api, isClient, fetchPengaturan]);

  return {
    pengaturan,
    loading,
    error,
    fetchPengaturan,
    updatePengaturan,
  };
};
