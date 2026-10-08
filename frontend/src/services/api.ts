/** Typed HTTP boundary. API keys never belong in the browser. */
export function createAPIClient(api: string, token: string) {
  return async function request<T = unknown>(
    path: string,
    options: RequestInit = {},
    auth = token,
  ) {
    const res = await fetch(api.replace(/\/$/, '') + path, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: 'Bearer ' + auth,
        ...options.headers,
      },
    });
    if (!res.ok) {
      let detail = 'Falha na API';
      try {
        detail = String(((await res.json()) as { detail?: unknown }).detail || detail);
      } catch {}
      throw Error(typeof detail === 'string' ? detail : 'Verifique os campos enviados');
    }
    return (res.status === 204 ? null : await res.json()) as T;
  };
}
