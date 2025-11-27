// Very small client-side mock fetch helper used in preview/template resolving.
// Recognizes URLs starting with `mock://` or simple keys and returns canned data.

export async function mockFetch(url: string) {
  // normalize
  const key = url.replace(/^mock:\/\//, '').trim();

  // basic examples — extend as needed
  const samples: Record<string, any> = {
    'user': { name: 'Jane Doe', email: 'jane@example.com', id: 'u_1' },
    'address': { street: '123 Main St', city: 'Bangkok', country: 'Thailand' },
    'sample-list': { data: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Bravo' }] },
    'api/sample-list': [{ id: '1', label: 'One' }, { id: '2', label: 'Two' }],
  };

  if (samples[key] !== undefined) return Promise.resolve(samples[key]);

  // default empty
  return Promise.resolve({});
}

export default mockFetch;
