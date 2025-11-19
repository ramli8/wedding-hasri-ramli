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

  const fetchTamu = async (filterParams?: TamuFilter) => {
    if (!tamuAPI) {
      console.error('TamuAPI not initialized');
      setError('API belum siap');
      return;
    }
    try {
      setLoading(true);
      const params = filterParams || filter;

      const response = await tamuAPI.getTamu(params);
      setTamu(response.data);
      setError(null);

      // Update filter if new filter was provided
      if (filterParams) {
        setFilter(filterParams);
      }
    } catch (err: any) {
      console.error('Error fetching tamu:', err);
      setError(err.message || 'Gagal memuat data tamu');
      setTamu([]);
    } finally {
      setLoading(false);
    }
  };

  const createTamu = async (tamuData: any) => {
    if (!tamuAPI) {
      console.error('TamuAPI not initialized');
      setError('API belum siap');
      throw new Error('API belum siap');
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
      console.error('TamuAPI not initialized');
      setError('API belum siap');
      throw new Error('API belum siap');
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
      console.error('TamuAPI not initialized');
      setError('API belum siap');
      throw new Error('API belum siap');
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

  // Effect untuk load data saat filter berubah
  useEffect(() => {
    if (tamuAPI && isClient) {
      fetchTamu();
    }
  }, [JSON.stringify(filter), tamuAPI, isClient]);

  return {
    tamu,
    loading,
    error,
    fetchTamu,
    createTamu,
    updateTamu,
    deleteTamu,
    filter,
    setFilter
  };
};