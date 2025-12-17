import { useState, useEffect, useCallback } from 'react';
import UserAPI, { User, Role, CreateUserInput } from '../../services/UserAPI';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<UserAPI | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    try {
      const apiInstance = new UserAPI();
      setApi(apiInstance);
    } catch (err: any) {
      console.error('Failed to initialize UserAPI:', err);
      setError(err.message || 'Gagal menginisialisasi API users');
    }
  }, []);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async (
    resetPagination: boolean = true,
    filters?: {
      status?: 'all' | 'active' | 'inactive';
      search?: string;
      roleId?: string;
    }
  ) => {
    if (!api) return;
    try {
      setLoading(true);
      const page = resetPagination ? 1 : pagination.page;
      const [usersResponse, rolesData] = await Promise.all([
        api.getUsers(page, pagination.limit, filters),
        api.getRoles(),
      ]);

      if (resetPagination) {
        setUsers(usersResponse.data);
      } else {
        setUsers((prev) => [...prev, ...usersResponse.data]);
      }

      setRoles(rolesData);

      if (usersResponse.pagination) {
        setPagination(usersResponse.pagination);
        setTotalCount(usersResponse.pagination.total);
        setHasMore(
          usersResponse.pagination.page < usersResponse.pagination.totalPages &&
            usersResponse.data.length === usersResponse.pagination.limit
        );
      } else {
        setHasMore(false);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Gagal memuat data users');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(
    async (filters?: {
      status?: 'all' | 'active' | 'inactive';
      search?: string;
      roleId?: string;
    }) => {
      if (!api || !hasMore || loading) return;

      try {
        setLoading(true);
        const nextPage = pagination.page + 1;
        const response = await api.getUsers(
          nextPage,
          pagination.limit,
          filters
        );

        setUsers((prev) => [...prev, ...response.data]);

        if (response.pagination) {
          setPagination(response.pagination);
          setHasMore(
            response.pagination.page < response.pagination.totalPages &&
              response.data.length === response.pagination.limit
          );
        }

        setError(null);
      } catch (err: any) {
        console.error('Error loading more users:', err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    },
    [api, pagination, hasMore, loading]
  );

  const createUser = async (input: CreateUserInput) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      const newUser = await api.createUser(input);
      setUsers((prev) => [newUser, ...prev]);
      setTotalCount((prev) => prev + 1);
      setError(null);
      return newUser;
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Gagal membuat user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, input: Partial<CreateUserInput>) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.updateUser(id, input);
      // Refetch to get updated data with roles
      await fetchUsers(true);
      setError(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Gagal update user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.deleteUser(id);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, deleted_at: new Date().toISOString() }
            : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Gagal menghapus user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreUser = async (id: string) => {
    if (!api) throw new Error('API belum siap');
    try {
      setLoading(true);
      await api.restoreUser(id);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted_at: undefined } : item
        )
      );
      setError(null);
    } catch (err: any) {
      console.error('Error restoring user:', err);
      setError(err.message || 'Gagal memulihkan user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api && isClient) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, isClient]);

  return {
    users,
    roles,
    loading,
    error,
    hasMore,
    totalCount,
    fetchUsers,
    loadMore,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
  };
};
