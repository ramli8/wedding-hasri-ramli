import { ReactNode, createContext, useState, useEffect } from 'react';
import AuthAPI, { AuthUser } from '@/modules/auth/services/AuthAPI';
import supabase from '@/lib/supabaseClient';

interface AccountInfo {
  name: string;
  prefUsername: string;
  activeRole: string;
  profPicture?: any;
  role: Array<{ id: string; name: string }>;
  nickname: string;
  identifier: string;
  group: string[];
  origin: string;
  unit: string;
  unitCode: string;
  userId?: string;
}

const AccountInfoContext = createContext<AccountInfo | null>(null);

export function AccountInfoProvider({ children }: { children: ReactNode }) {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const authAPI = new AuthAPI();

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (typeof window === 'undefined') return;
      
      const session = authAPI.getSession();
      if (!session) return;

      try {
        // Fetch actual role IDs from database
        const { data: rolesData, error } = await supabase
          .from('roles')
          .select('id, name, is_default')
          .in('name', session.roles);

        if (error) throw error;

        // Get active role ID from localStorage
        const activeRoleId = localStorage.getItem('active_role_id');
        
        // Determine which role to use
        let selectedRoleId = activeRoleId;
        
        // If no active role in localStorage, use default role
        if (!selectedRoleId && rolesData && rolesData.length > 0) {
          const defaultRole = rolesData.find(r => r.is_default);
          selectedRoleId = defaultRole?.id || rolesData[0]?.id || '';
          
          // Save default role to localStorage for next time
          if (selectedRoleId) {
            localStorage.setItem('active_role_id', selectedRoleId);
          }
        }

        // Transform AuthUser to AccountInfo format
        const info: AccountInfo = {
          name: session.name,
          prefUsername: session.username,
          activeRole: selectedRoleId || '',
          role: rolesData || [],
          nickname: session.name.split(' ')[0],
          identifier: session.username,
          group: ['admin'],
          origin: '',
          unit: 'Wedding Admin',
          unitCode: 'ADMIN',
          userId: session.id
        };
        setAccountInfo(info);
      } catch (error) {
        console.error('Error fetching account info:', error);
      }
    };

    fetchAccountInfo();
  }, []);

  return (
    <AccountInfoContext.Provider value={accountInfo}>
      {children}
    </AccountInfoContext.Provider>
  );
}

export default AccountInfoContext;