export async function fetchTimeModel() {
  const res = await fetch('/api/time-model');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch time model');
  }
  return await res.json();
}

export async function saveTimeModel(data) {
  const res = await fetch('/api/time-model', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save time model');
  }
  return await res.json();
}
