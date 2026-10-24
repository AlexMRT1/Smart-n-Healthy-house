import { buildSetCookie, readCookieValue, buildDeleteCookie } from './cookieFormat.mjs';

export function setCookie(name, value, days = 7) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = buildSetCookie(name, value, expires);
    console.log(`Cookie set: ${name}`); // Debug log
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error);
  }
}

export function getCookie(name) {
  try {
    return readCookieValue(document.cookie, name);
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return '';
  }
}

export function deleteCookie(name) {
  document.cookie = buildDeleteCookie(name);
}

export function checkCookies() {
  console.log('Current cookies:', document.cookie); // Debug function
}