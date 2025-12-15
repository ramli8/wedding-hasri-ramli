import supabase from '@/lib/supabaseClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  roles: string[];
}

class AuthAPI {
  private readonly SESSION_KEY = 'wedding_admin_session';

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    // Query user with roles
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        name,
        password_hash,
        user_roles (
          roles (
            name
          )
        )
      `)
      .eq('username', credentials.username)
      .single();

    if (error || !user) {
      throw new Error('Username atau password salah');
    }

    // Simple password check (in production, use bcrypt)
    if (user.password_hash !== credentials.password) {
      throw new Error('Username atau password salah');
    }

    // Transform roles
    const roles = user.user_roles.map((ur: any) => ur.roles.name);

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      roles
    };

    // Store session in localStorage (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(authUser));
      // Dispatch custom event to notify session change
      window.dispatchEvent(new Event('sessionChanged'));
    }

    return authUser;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem('active_role_id');
      // Dispatch custom event to notify session change
      window.dispatchEvent(new Event('sessionChanged'));
    }
  }

  getSession(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }

  getCurrentUser(): { id: string; username: string; name: string; activeRole?: string; roles: string[] } | null {
    if (typeof window === 'undefined') return null;
    
    const session = this.getSession();
    if (!session) return null;

    // Get active role from localStorage
    const activeRole = localStorage.getItem('active_role_id');
    
    return {
      ...session,
      activeRole: activeRole || undefined,
    };
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }
}

export default AuthAPI;
