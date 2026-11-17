export type UserRole = 'admin' | 'user';

export type ActiveTab =
  | 'home'
  | 'jobs'
  | 'applications'
  | 'analytics'
  | 'profile'
  | 'resume'
  | 'admin';

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isAdmin: boolean;
  provider: string;
  mode: 'supabase';
  createdAt?: string | null;
  lastSignInAt?: string | null;
}
