export async function fetchInstitution() {
  const res = await fetch('/api/institution');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch institution');
  }
  return await res.json();
}

export async function saveInstitution(data) {
  const res = await fetch('/api/institution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save institution');
  }
  return await res.json();
}
