import Cookies from 'js-cookie';

// Use secure, SameSite-strict cookies to reduce token exposure risk.
// In local development (http://localhost), `secure: true` is relaxed by browsers,
// so this is safe to set unconditionally.
const COOKIE_OPTIONS = { secure: true, sameSite: 'strict' as const };

export function getAccessToken() {
  return Cookies.get('accessToken');
}

export function isAuthenticated() {
  return !!Cookies.get('accessToken');
}

export function logout() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string) {
  Cookies.set('accessToken', accessToken, { expires: 1, ...COOKIE_OPTIONS });
  Cookies.set('refreshToken', refreshToken, { expires: 30, ...COOKIE_OPTIONS });
}
