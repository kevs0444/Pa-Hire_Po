export type UserRole = 'admin' | 'user';

export type ActiveTab =
  | 'home'
  | 'jobs'
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
  mode: 'supabase' | 'local-admin';
  createdAt?: string | null;
  lastSignInAt?: string | null;
}
