import { useState, useEffect } from 'react';
import { KategoriTamu, CreateKategoriTamuInput, UpdateKategoriTamuInput } from '../../types/KategoriTamu.types';
import KategoriTamuAPI from '../../services/KategoriTamuAPI';

export const useKategoriTamu = () => {
  const [kategoriTamu, setKategoriTamu] = useState<KategoriTamu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<KategoriTamuAPI | null>(null);
  const [isClient, setIsClient] = useState(false);

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

  const fetchKategoriTamu = async () => {
    if (!api) return;
    try {
      setLoading(true);
      const data = await api.getAll();
      setKategoriTamu(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching kategori tamu:', err);
      setError(err.message || 'Gagal memuat data kategori tamu');
    } finally {
      setLoading(false);
    }
  };

  const createKategoriTamu = async (input: CreateKategoriTamuInput) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const newData = await api.create(input);
      setKategoriTamu(prev => [...prev, newData]);
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

  const updateKategoriTamu = async (id: string, input: UpdateKategoriTamuInput) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const updatedData = await api.update(id, input);
      setKategoriTamu(prev => prev.map(item => item.id === id ? updatedData : item));
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
      setKategoriTamu(prev => prev.filter(item => item.id !== id));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting kategori tamu:', err);
      setError(err.message || 'Gagal menghapus kategori tamu');
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
    fetchKategoriTamu,
    createKategoriTamu,
    updateKategoriTamu,
    deleteKategoriTamu
  };
};
