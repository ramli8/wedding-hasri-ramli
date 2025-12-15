import { useState, useEffect } from 'react';
import { Tamu, TamuFilter } from '../../types/Tamu.types';
import TamuAPI from '../../services/TamuAPI';

export const useTamu = (initialFilter?: TamuFilter) => {
  const [tamu, setTamu] = useState<Tamu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TamuFilter>(initialFilter || {});
  const [tamuAPI, setTamuAPI] = useState<TamuAPI | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [hasMore, setHasMore] = useState(true);

  // Initialize the API client only on the client side
  useEffect(() => {
    setIsClient(true);
    try {
      const api = new TamuAPI();
      setTamuAPI(api);
    } catch (err: any) {
      console.error('Failed to initialize TamuAPI:', err);
      setError(err.message || 'Gagal menginisialisasi API tamu');
    }
  }, []);

  const fetchTamu = async (filterParams?: TamuFilter, resetPagination = true) => {
    // Wait for API to be ready
    if (!tamuAPI) {
      console.log('Waiting for TamuAPI to initialize...');
      // Don't set loading here, will be called again when API is ready
      return;
    }
    
    try {
      setLoading(true);
      const params = {
        ...(filterParams || filter),
        page: resetPagination ? 1 : pagination.page,
        limit: pagination.limit,
      };

      const response = await tamuAPI.getTamu(params);
      
      if (resetPagination) {
        setTamu(response.data);
      } else {
        // Append for load more
        setTamu(prev => [...prev, ...response.data]);
      }
      
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        });
        setHasMore(
          response.pagination.page < response.pagination.totalPages &&
          response.data.length === response.pagination.limit
        );
      } else {
        setHasMore(false);
      }
      
      setError(null);

      // Update filter if new filter was provided
      if (filterParams) {
        setFilter(filterParams);
      }
    } catch (err: any) {
      console.error('Error fetching tamu:', err);
      setError(err.message || 'Gagal memuat data tamu');
      if (resetPagination) {
        setTamu([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading || !tamuAPI) return;
    
    try {
      setLoading(true);
      const nextPage = pagination.page + 1;
      const params = {
        ...filter,
        page: nextPage,
        limit: pagination.limit,
      };

      const response = await tamuAPI.getTamu(params);
      setTamu(prev => [...prev, ...response.data]);
      
      if (response.pagination) {
        setPagination(response.pagination);
        setHasMore(
          response.pagination.page < response.pagination.totalPages &&
          response.data.length === response.pagination.limit
        );
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading more tamu:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const createTamu = async (tamuData: any) => {
    if (!tamuAPI) {
      throw new Error('TamuAPI belum ready, silakan tunggu sebentar');
    }
    try {
      setLoading(true);
      const newTamu = await tamuAPI.createTamu(tamuData);
      setTamu(prev => [...prev, newTamu]);
      setError(null);
      return newTamu;
    } catch (err: any) {
      console.error('Error creating tamu:', err);
      setError(err.message || 'Gagal menambah tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTamu = async (id: string, updates: any) => {
    if (!tamuAPI) {
      throw new Error('TamuAPI belum ready, silakan tunggu sebentar');
    }
    try {
      setLoading(true);
      const updatedTamu = await tamuAPI.updateTamu(id, updates);
      setTamu(prev => prev.map(t => t.id === id ? updatedTamu : t));
      setError(null);
      return updatedTamu;
    } catch (err: any) {
      console.error('Error updating tamu:', err);
      setError(err.message || 'Gagal memperbarui tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTamu = async (id: string) => {
    if (!tamuAPI) {
      throw new Error('TamuAPI belum ready, silakan tunggu sebentar');
    }
    try {
      setLoading(true);
      await tamuAPI.deleteTamu(id);
      setTamu(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting tamu:', err);
      setError(err.message || 'Gagal menghapus tamu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Return API ready state so page can react to it
  return {
    tamu,
    loading,
    error,
    fetchTamu,
    loadMore,
    createTamu,
    updateTamu,
    deleteTamu,
    filter,
    setFilter,
    pagination,
    hasMore,
    isApiReady: !!tamuAPI, // Add this so page knows when to fetch
  };
};