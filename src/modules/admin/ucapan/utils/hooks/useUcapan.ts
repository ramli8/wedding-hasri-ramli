import { useState, useEffect, useCallback } from 'react';
import UcapanAPI from '../../services/UcapanAPI';
import { UcapanWithReplies, CreateUcapanData } from '../../types/Ucapan.types';

export const useUcapan = () => {
  const [ucapanList, setUcapanList] = useState<UcapanWithReplies[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<UcapanAPI | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    try {
      const apiInstance = new UcapanAPI();
      setApi(apiInstance);
    } catch (err: any) {
      console.error('Failed to initialize UcapanAPI:', err);
      setError(err.message || 'Gagal menginisialisasi API ucapan');
    }
  }, []);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchUcapan = async (
    resetPagination: boolean = true,
    filters?: { status?: 'all' | 'active' | 'inactive'; search?: string }
  ) => {
    if (!api) return;
    try {
      setLoading(true);
      const page = resetPagination ? 1 : pagination.page;
      const response = await api.getUcapan(page, pagination.limit, filters);

      if (resetPagination) {
        setUcapanList(response.data);
      } else {
        setUcapanList((prev) => [...prev, ...response.data]);
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
      console.error('Error fetching ucapan:', err);
      setError(err.message || 'Gagal memuat data ucapan');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(
    async (filters?: {
      status?: 'all' | 'active' | 'inactive';
      search?: string;
    }) => {
      if (!api || !hasMore || loading) return;

      try {
        setLoading(true);
        const nextPage = pagination.page + 1;
        const response = await api.getUcapan(
          nextPage,
          pagination.limit,
          filters
        );

        setUcapanList((prev) => [...prev, ...response.data]);

        if (response.pagination) {
          setPagination(response.pagination);
          setHasMore(
            response.pagination.page < response.pagination.totalPages &&
              response.data.length === response.pagination.limit
          );
        }

        setError(null);
      } catch (err: any) {
        console.error('Error loading more ucapan:', err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination, hasMore, loading]
  );

  const deleteUcapan = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.deleteUcapan(id);
      setUcapanList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, deleted_at: new Date().toISOString() }
            : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error deleting ucapan:', err);
      setError(err.message || 'Gagal menghapus ucapan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreUcapan = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.restoreUcapan(id);
      setUcapanList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: undefined } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error restoring ucapan:', err);
      setError(err.message || 'Gagal memulihkan ucapan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api && isClient) {
      fetchUcapan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isClient]);

  return {
    ucapanList,
    loading,
    error,
    hasMore,
    totalCount,
    api,
    fetchUcapan,
    loadMore,
    deleteUcapan,
    restoreUcapan,
  };
};
