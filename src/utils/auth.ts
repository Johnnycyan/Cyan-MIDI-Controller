/**
 * Validates a token by checking if it's not expired
 * This is just a mockup function for the showcase
 */
export async function validateToken(token: string): Promise<boolean> {
  // In a real app, you would validate the token against your backend
  // For this showcase, we'll just return true if the token exists
  return Boolean(token);
}

/**
 * Mock login function for the showcase
 */
export async function login(username: string, password: string): Promise<string | null> {
  // For the showcase, return a fake token if credentials are provided
  if (username && password) {
    return 'showcase-token-123456789';
  }
  return null;
}

export async function checkAuthentication(): Promise<boolean> {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const response = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('themeMode');
  localStorage.removeItem('accentColor');
}
