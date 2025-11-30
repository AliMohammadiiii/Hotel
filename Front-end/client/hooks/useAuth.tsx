import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginApi, logout as logoutApi, getCurrentUser, getUser, loginWithInjast as loginWithInjastApi, signup as signupApi, type User, type SignupRequest } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  loginWithInjast: (sessionCode: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
      // Try to refresh user info from server
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // If fetch fails, user might be logged out
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await loginApi(username, password);
    setUser(response.user);
  };

  const signup = async (data: SignupRequest) => {
    const response = await signupApi(data);
    setUser(response.user);
  };

  const loginWithInjast = async (sessionCode: string) => {
    const response = await loginWithInjastApi(sessionCode);
    setUser(response.user);
  };

  const logout = () => {
    logoutApi();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithInjast,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

