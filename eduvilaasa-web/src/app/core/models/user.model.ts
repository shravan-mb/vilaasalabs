export type Role =
  | 'institution_admin'
  | 'institution_staff'
  | 'teacher'
  | 'student'
  | 'parent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  institution_id: string;
  phone?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
