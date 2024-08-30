// En @/lib/api.ts
export async function fetchInitialData() {
    const response = await fetch('/api/initial-sales-data');
    if (!response.ok) {
      throw new Error('Failed to fetch initial data');
    }
    return response.json();
  }