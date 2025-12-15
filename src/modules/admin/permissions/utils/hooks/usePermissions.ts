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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchPermissions = useCallback(
    async (
      resetPagination: boolean = true,
      filters?: {
        roleId?: string;
        status?: 'all' | 'active' | 'inactive';
        search?: string;
      }
    ) => {
      try {
        setLoading(true);
        const page = resetPagination ? 1 : pagination.page;
        const response = await api.getAllPermissions(true, page, pagination.limit, filters);

        if (resetPagination) {
          setPermissions(response.data);
          // Reset pagination state when resetting
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          setPermissions((prev) => [...prev, ...response.data]);
          // Update pagination state when appending
          if (response.pagination) {
            setPagination(response.pagination);
          }
        }

        if (response.pagination) {
          setTotalCount(response.pagination.total);
          // hasMore hanya jika masih ada halaman berikutnya
          setHasMore(
            response.pagination.page < response.pagination.totalPages
          );
        } else {
          setHasMore(false);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.message || 'Gagal mengambil data permission');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination.page, pagination.limit]
  );

  const loadMore = useCallback(
    async (filters?: {
      roleId?: string;
      status?: 'all' | 'active' | 'inactive';
      search?: string;
    }) => {
      if (!hasMore || loading) return;

      try {
        setLoading(true);
        const nextPage = pagination.page + 1;
        const response = await api.getAllPermissions(true, nextPage, pagination.limit, filters);

        setPermissions((prev) => [...prev, ...response.data]);

        if (response.pagination) {
          setPagination(response.pagination);
          setHasMore(response.pagination.page < response.pagination.totalPages);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error loading more permissions:', err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination, hasMore, loading]
  );

  // Note: Initial fetch is handled by the page component, not here
  // This allows the page to pass filters on initial load

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
