export async function fetchDepartments() {
  const res = await fetch('/api/departments');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch departments');
  }
  return await res.json();
}

export async function createDepartment(data) {
  const res = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create department');
  }
  return await res.json();
}

export async function fetchPrograms() {
  const res = await fetch('/api/programs');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch programs');
  }
  return await res.json();
}

export async function createProgram(data) {
  const res = await fetch('/api/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create program');
  }
  return await res.json();
}
