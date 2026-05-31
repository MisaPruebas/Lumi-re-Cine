export async function api(method, url, body) {
  const opts = { method, headers: {}, credentials: 'include' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
  return data;
}

export const get  = (url)       => api('GET',    url);
export const post = (url, body) => api('POST',   url, body);
export const put  = (url, body) => api('PUT',    url, body);
export const del  = (url)       => api('DELETE', url);
