import { useState, useEffect, useCallback } from 'react';
import PermissionAPI, { RolePermission } from '../../services/PermissionAPI';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<
    (RolePermission & { roles: { name: string } })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api] = useState(() => new PermissionAPI());
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPermissions = useCallback(
    async (append: boolean = false) => {
      try {
        setLoading(true);
        // Fetch ALL permissions for client-side filtering and grouping
        const data = await api.getAllPermissions(true);

        if (append) {
          setPermissions((prev) => [...prev, ...data]);
        } else {
          setPermissions(data);
        }

        setTotalCount(data.length);
        setHasMore(false); // Since we fetch all
        setError(null);
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.message || 'Gagal mengambil data permission');
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const offset = permissions.length;
      const limit = 12;

      const data = await api.getAllPermissions(true, { limit, offset });

      if (data.length < limit) {
        setHasMore(false);
      }

      setPermissions((prev) => [...prev, ...data]);
      setError(null);
    } catch (err: any) {
      console.error('Error loading more permissions:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [api, permissions.length, hasMore, loading]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const createPermission = async (
    permission: Omit<RolePermission, 'id' | 'created_at'>
  ) => {
    try {
      setLoading(true);
      await api.createPermission(permission);
      await fetchPermissions(); // Refresh full list
      setError(null);
    } catch (err: any) {
      console.error('Error creating permission:', err);
      setError(err.message || 'Gagal membuat permission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    id: string,
    updates: Partial<RolePermission>
  ) => {
    try {
      setLoading(true);
      await api.updatePermission(id, updates);
      // Optimistic update
      setPermissions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      setError(null);
    } catch (err: any) {
      console.error('Error updating permission:', err);
      setError(err.message || 'Gagal mengupdate permission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (id: string) => {
    try {
      setLoading(true);
      await api.deletePermission(id);
      // Soft delete update local
      setPermissions((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, deleted_at: new Date().toISOString() }
            : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error deleting permission:', err);
      setError(err.message || 'Gagal menghapus permission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restorePermission = async (id: string) => {
    try {
      setLoading(true);
      await api.restorePermission(id);
      // Restore update local
      setPermissions((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: null } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error restoring permission:', err);
      setError(err.message || 'Gagal memulihkan permission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    error,
    hasMore,
    totalCount,
    fetchPermissions,
    loadMore,
    createPermission,
    updatePermission,
    deletePermission,
    restorePermission,
  };
};
