export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  pages?: number;
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) {
    if (
      res.status === 401 &&
      location.pathname.startsWith('/admin') &&
      location.pathname !== '/admin/login'
    )
      location.assign('/admin/login');
    throw new Error(json.error || 'Unable to complete your request.');
  }
  return json;
}
