export async function fetchValidation() {
  const res = await fetch('/api/activities/validation');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch validation results');
  }
  return res.json();
}
