import { useState, useEffect, useCallback } from 'react';
import {
  KategoriTamu,
  CreateKategoriTamuInput,
  UpdateKategoriTamuInput,
} from '../../types/KategoriTamu.types';
import KategoriTamuAPI from '../../services/KategoriTamuAPI';

export const useKategoriTamu = () => {
  const [kategoriTamu, setKategoriTamu] = useState<KategoriTamu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<KategoriTamuAPI | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    try {
      const apiInstance = new KategoriTamuAPI();
      setApi(apiInstance);
    } catch (err: any) {
      console.error('Failed to initialize KategoriTamuAPI:', err);
      setError(err.message || 'Gagal menginisialisasi API kategori tamu');
    }
  }, []);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchKategoriTamu = async (
    resetPagination: boolean = true,
    filters?: { status?: 'all' | 'active' | 'inactive' }
  ) => {
    if (!api) return;
    try {
      setLoading(true);
      const page = resetPagination ? 1 : pagination.page;
      const response = await api.getAll(page, pagination.limit, filters);

      if (resetPagination) {
        setKategoriTamu(response.data);
      } else {
        setKategoriTamu((prev) => [...prev, ...response.data]);
      }

      if (response.pagination) {
        setPagination(response.pagination);
        setTotalCount(response.pagination.total);
        setHasMore(
          response.pagination.page < response.pagination.totalPages &&
          response.data.length === response.pagination.limit
        );
      } else {
        setHasMore(false);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching kategori tamu:', err);
      setError(err.message || 'Gagal memuat data kategori tamu');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(
    async (filters?: { status?: 'all' | 'active' | 'inactive' }) => {
      if (!api || !hasMore || loading) return;

      try {
        setLoading(true);
        const nextPage = pagination.page + 1;
        const response = await api.getAll(nextPage, pagination.limit, filters);

      setKategoriTamu((prev) => [...prev, ...response.data]);

      if (response.pagination) {
        setPagination(response.pagination);
        setHasMore(
          response.pagination.page < response.pagination.totalPages &&
          response.data.length === response.pagination.limit
        );
      }

      setError(null);
    } catch (err: any) {
      console.error('Error loading more kategori tamu:', err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination, hasMore, loading]
  );

  const createKategoriTamu = async (input: CreateKategoriTamuInput) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const newData = await api.create(input);
      setKategoriTamu((prev) => [...prev, newData]);
      setTotalCount((prev) => prev + 1);
      setError(null);
      return newData;
    } catch (err: any) {
      console.error('Error creating kategori tamu:', err);
      setError(err.message || 'Gagal menambah kategori tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateKategoriTamu = async (
    id: string,
    input: UpdateKategoriTamuInput
  ) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const updatedData = await api.update(id, input);
      setKategoriTamu((prev) =>
        prev.map((item) => (item.id === id ? updatedData : item))
      );
      setError(null);
      return updatedData;
    } catch (err: any) {
      console.error('Error updating kategori tamu:', err);
      setError(err.message || 'Gagal memperbarui kategori tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteKategoriTamu = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.delete(id);
      setKategoriTamu((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: new Date() } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error deleting kategori tamu:', err);
      setError(err.message || 'Gagal menghapus kategori tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const restoreKategoriTamu = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.restore(id);
      setKategoriTamu((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: undefined } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error restoring kategori tamu:', err);
      setError(err.message || 'Gagal memulihkan kategori tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api && isClient) {
      fetchKategoriTamu();
    }
  }, [api, isClient]);

  return {
    kategoriTamu,
    loading,
    error,
    hasMore,
    totalCount,
    fetchKategoriTamu,
    loadMore,
    createKategoriTamu,
    updateKategoriTamu,
    deleteKategoriTamu,
    restoreKategoriTamu,
  };
};
