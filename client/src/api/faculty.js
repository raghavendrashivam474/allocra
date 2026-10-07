export async function fetchFaculty() {
  const res = await fetch('/api/faculty');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch faculty members');
  }
  return await res.json();
}

export async function createFaculty(data) {
  const res = await fetch('/api/faculty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create faculty member');
  }
  return await res.json();
}
