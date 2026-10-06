const API_BASE = '/api/setup';

export async function fetchReadiness() {
  const res = await fetch(`${API_BASE}/readiness`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch setup readiness');
  }
  return res.json();
}
