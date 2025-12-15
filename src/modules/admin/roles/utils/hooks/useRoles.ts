import { useState, useEffect, useCallback } from 'react';
import RoleAPI from '../../services/RoleAPI';
import { Role, CreateRoleInput, UpdateRoleInput } from '../../types/Role.types';

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api] = useState(() => new RoleAPI());
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchRoles = useCallback(
    async (
      resetPagination: boolean = true,
      filters?: { status?: 'all' | 'active' | 'inactive' }
    ) => {
      try {
        setLoading(true);
        const page = resetPagination ? 1 : pagination.page;
        const response = await api.getRoles(true, page, pagination.limit, filters);

        if (resetPagination) {
          setRoles(response.data);
        } else {
          setRoles((prev) => [...prev, ...response.data]);
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
        console.error('Error fetching roles:', err);
        setError(err.message || 'Gagal mengambil data role');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination.page, pagination.limit]
  );

  const loadMore = useCallback(
    async (filters?: { status?: 'all' | 'active' | 'inactive' }) => {
      if (!hasMore || loading) return;

      try {
        setLoading(true);
        const nextPage = pagination.page + 1;
        const response = await api.getRoles(true, nextPage, pagination.limit, filters);

      setRoles((prev) => [...prev, ...response.data]);

      if (response.pagination) {
        setPagination(response.pagination);
        setHasMore(
          response.pagination.page < response.pagination.totalPages &&
          response.data.length === response.pagination.limit
        );
      }

        setError(null);
      } catch (err: any) {
        console.error('Error loading more roles:', err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination, hasMore, loading]
  );

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRole = async (input: CreateRoleInput) => {
    try {
      setLoading(true);
      const newRole = await api.createRole(input);
      setRoles((prev) => [newRole, ...prev]);
      setTotalCount((prev) => prev + 1);
      setError(null);
      return newRole;
    } catch (err: any) {
      console.error('Error creating role:', err);
      setError(err.message || 'Gagal membuat role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, input: UpdateRoleInput) => {
    try {
      setLoading(true);
      const updatedRole = await api.updateRole(id, input);
      setRoles((prev) =>
        prev.map((item) => (item.id === id ? updatedRole : item))
      );
      setError(null);
      return updatedRole;
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Gagal mengupdate role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id: string) => {
    try {
      setLoading(true);
      const deletedRole = await api.deleteRole(id);
      // Update local state to reflect soft delete
      setRoles((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, deleted_at: deletedRole.deleted_at }
            : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Gagal menghapus role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreRole = async (id: string) => {
    try {
      setLoading(true);
      const restoredRole = await api.restoreRole(id);
      // Update local state to reflect restore
      setRoles((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: null } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error restoring role:', err);
      setError(err.message || 'Gagal memulihkan role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    roles,
    loading,
    error,
    hasMore,
    totalCount,
    fetchRoles,
    loadMore,
    createRole,
    updateRole,
    deleteRole,
    restoreRole,
  };
};
