export function setCookie(name, value, days = 7) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
    console.log(`Cookie set: ${name}`); // Debug log
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error);
  }
}

export function getCookie(name) {
  try {
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value ? decodeURIComponent(value) : '';
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return '';
  }
}

export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function checkCookies() {
  console.log('Current cookies:', document.cookie); // Debug function
}