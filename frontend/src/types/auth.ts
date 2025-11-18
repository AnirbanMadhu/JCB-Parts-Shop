export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive?: boolean;
  createdAt?: string;
  mustChangePassword?: boolean;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
  isLoading: boolean;
}

export interface InviteUserData {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}
