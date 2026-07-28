const API_BASE = ''; // Relies on Vite proxy to forward requests to Django backend at http://localhost:8000

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  // Add Authorization header if token exists and skipAuth is not set
  if (!options.skipAuth) {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  // Ensure JSON requests set Content-Type
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, fetchOptions);

  // If unauthorized, attempt token refresh
  if (response.status === 401 && !options.skipAuth) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch('/api/accounts/token/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access;
          
          localStorage.setItem('accessToken', newAccessToken);
          
          // Retry the request with the new access token
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          response = await fetch(url, fetchOptions);
        } else {
          // Refresh token expired or invalid, trigger logout
          handleAuthFailure();
        }
      } catch (error) {
        handleAuthFailure();
      }
    } else {
      handleAuthFailure();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || JSON.stringify(errorData) || 'An error occurred';
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function handleAuthFailure() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Dispatch a custom event to notify stores / app
  window.dispatchEvent(new Event('auth-logout'));
}
