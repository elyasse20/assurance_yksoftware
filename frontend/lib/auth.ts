import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  id: string;
  sub: string;   // email
  role: string;
  exp: number;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function saveAuth(token: string, user: object) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    // Delete cookie by setting expiration to the past
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return !!token && !isTokenExpired(token);
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'ADMIN';
}
