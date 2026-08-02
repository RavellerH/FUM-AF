export const PASSWORD_SESSION_KEY = 'fum_unlocked';

export function clearPasswordSession() {
  sessionStorage.removeItem(PASSWORD_SESSION_KEY);
}
