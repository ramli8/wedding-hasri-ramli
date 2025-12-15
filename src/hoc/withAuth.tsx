import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthAPI from '@/modules/auth/services/AuthAPI';
import PermissionAPI from '@/modules/admin/permissions/services/PermissionAPI';
import { Box, Spinner, Flex } from '@chakra-ui/react';

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  const AuthenticatedComponent = (props: any) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      const checkAuthAndPermission = async () => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const authAPI = new AuthAPI();
        const permissionAPI = new PermissionAPI();

        // Check authentication first (synchronous) - FAST CHECK
        if (!authAPI.isAuthenticated()) {
          // Immediately redirect without setting any state to prevent flash
          router.replace('/admin/login');
          return;
        }

        setIsAuthenticated(true);

        // Get current user and active role
        const currentUser = authAPI.getCurrentUser();
        if (!currentUser) {
          setIsChecking(false);
          router.replace('/admin/login');
          return;
        }

        // If no active role, use the first available role
        let roleId = currentUser.activeRole;
        if (!roleId && currentUser.roles && currentUser.roles.length > 0) {
          // Get role ID from first role name
          const { data: roleData } = await permissionAPI.supabase
            .from('roles')
            .select('id')
            .eq('name', currentUser.roles[0])
            .single();
          
          if (roleData) {
            roleId = roleData.id;
            // Save as active role for next time
            if (typeof window !== 'undefined') {
              localStorage.setItem('active_role_id', roleId as string);
            }
          }
        }

        if (!roleId) {
          setIsChecking(false);
          router.replace('/admin/login');
          return;
        }

        // Check permission for current URL
        const currentPath = router.pathname;
        
        try {
          const permissionCheck = await permissionAPI.checkAccess(
            roleId,
            currentPath
          );

          if (permissionCheck.hasAccess) {
            setHasPermission(true);
            setIsChecking(false);
          } else {
            // Check if the role actually exists (handle stale localStorage data)
            const { data: roleExists } = await permissionAPI.supabase
              .from('roles')
              .select('id')
              .eq('id', roleId)
              .single();

            if (!roleExists) {
              // Role ID is invalid (likely from stale localStorage), clear it and reload
              if (typeof window !== 'undefined') {
                localStorage.removeItem('active_role_id');
                window.location.reload();
                return;
              }
            }

            // Redirect to 403 Forbidden page
            setIsChecking(false);
            router.replace('/403');
          }
        } catch (error) {
          console.error('Permission check error:', error);
          setIsChecking(false);
          router.replace('/403');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuthAndPermission();
    }, [router, router.pathname]);

    // Show loading spinner while checking auth (prevents flash)
    // IMPORTANT: Return early to prevent ANY layout rendering
    if (typeof window === 'undefined' || isChecking || isLoading) {
      return null; // Return null instead of spinner to prevent any flash
    }

    // Don't render anything if not authenticated or no permission (redirecting)
    if (!isAuthenticated || !hasPermission) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
