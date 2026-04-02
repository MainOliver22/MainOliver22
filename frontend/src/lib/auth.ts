import Cookies from 'js-cookie';

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
  Cookies.set('accessToken', accessToken, { expires: 1 });
  Cookies.set('refreshToken', refreshToken, { expires: 30 });
}
