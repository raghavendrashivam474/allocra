export async function fetchCalendar() {
  const res = await fetch('/api/calendar');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch calendar');
  }
  return await res.json();
}

export async function saveCalendar(data) {
  const res = await fetch('/api/calendar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save calendar');
  }
  return await res.json();
}
