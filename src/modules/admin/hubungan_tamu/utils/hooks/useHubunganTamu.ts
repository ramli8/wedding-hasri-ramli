import { useState, useEffect, useCallback } from 'react';
import {
  HubunganTamu,
  CreateHubunganTamuInput,
  UpdateHubunganTamuInput,
} from '../../types/HubunganTamu.types';
import HubunganTamuAPI from '../../services/HubunganTamuAPI';

export const useHubunganTamu = () => {
  const [hubunganTamu, setHubunganTamu] = useState<HubunganTamu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<HubunganTamuAPI | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    try {
      const apiInstance = new HubunganTamuAPI();
      setApi(apiInstance);
    } catch (err: any) {
      console.error('Failed to initialize HubunganTamuAPI:', err);
      setError(err.message || 'Gagal menginisialisasi API hubungan tamu');
    }
  }, []);

  const fetchHubunganTamu = async (append: boolean = false) => {
    if (!api) return;
    try {
      setLoading(true);

      // For initial load or refresh, get all data
      // This is optimal for small datasets like hubungan_tamu
      const data = await api.getAll();

      if (append) {
        setHubunganTamu((prev) => [...prev, ...data]);
      } else {
        setHubunganTamu(data);
      }

      setTotalCount(data.length);
      setHasMore(false); // We load all data at once
      setError(null);
    } catch (err: any) {
      console.error('Error fetching hubungan tamu:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (!api || !hasMore || loading) return;

    try {
      setLoading(true);
      const offset = hubunganTamu.length;
      const limit = 12;

      const data = await api.getAll({ limit, offset });

      if (data.length < limit) {
        setHasMore(false);
      }

      setHubunganTamu((prev) => [...prev, ...data]);
      setError(null);
    } catch (err: any) {
      console.error('Error loading more hubungan tamu:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [api, hubunganTamu.length, hasMore, loading]);

  const createHubunganTamu = async (input: CreateHubunganTamuInput) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const newData = await api.create(input);
      setHubunganTamu((prev) => [...prev, newData]);
      setTotalCount((prev) => prev + 1);
      setError(null);
      return newData;
    } catch (err: any) {
      console.error('Error creating hubungan tamu:', err);
      setError(err.message || 'Gagal menambah hubungan tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateHubunganTamu = async (
    id: string,
    input: UpdateHubunganTamuInput
  ) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const updatedData = await api.update(id, input);
      setHubunganTamu((prev) =>
        prev.map((item) => (item.id === id ? updatedData : item))
      );
      setError(null);
      return updatedData;
    } catch (err: any) {
      console.error('Error updating hubungan tamu:', err);
      setError(err.message || 'Gagal memperbarui hubungan tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteHubunganTamu = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.delete(id);
      setHubunganTamu((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: new Date() } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error deleting hubungan tamu:', err);
      setError(err.message || 'Gagal menghapus hubungan tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreHubunganTamu = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.restore(id);
      setHubunganTamu((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: undefined } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error restoring hubungan tamu:', err);
      setError(err.message || 'Gagal memulihkan hubungan tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api && isClient) {
      fetchHubunganTamu();
    }
  }, [api, isClient]);

  return {
    hubunganTamu,
    loading,
    error,
    hasMore,
    totalCount,
    fetchHubunganTamu,
    loadMore,
    createHubunganTamu,
    updateHubunganTamu,
    deleteHubunganTamu,
    restoreHubunganTamu,
  };
};
