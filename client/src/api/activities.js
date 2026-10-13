export async function fetchActivities() {
  const res = await fetch('/api/activities');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch activities');
  }
  return await res.json();
}

export async function createActivity(data) {
  const res = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create activity');
  }
  return await res.json();
}
