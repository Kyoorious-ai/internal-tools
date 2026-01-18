import { useState, useEffect } from 'react';
import {
  fetchAllDropdownData,
  type Board,
  type Class,
  type Subject,
  type Chapter,
  type Medium,
  type DropdownData,
} from '../services/apiService';

interface UseDropdownDataReturn {
  data: DropdownData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage dropdown data
 * Fetches all dropdown data (boards, classes, subjects, chapters, mediums) in a single call
 */
export function useDropdownData(): UseDropdownDataReturn {
  const [data, setData] = useState<DropdownData>({
    boards: [],
    classes: [],
    subjects: [],
    chapters: [],
    mediums: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dropdownData = await fetchAllDropdownData();
      setData(dropdownData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dropdown data';
      setError(errorMessage);
      console.error('Error fetching dropdown data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Get display name for an item (handles different field names)
 */
export function getDisplayName(item: Board | Class | Subject | Chapter | Medium): string {
  // Try common field names
  if ('name' in item && item.name) return String(item.name);
  if ('title' in item && item.title) return String(item.title);
  if ('label' in item && item.label) return String(item.label);
  // Fallback to id
  return String(item.id || 'Unknown');
}

/**
 * Get value (id) for an item
 */
export function getItemValue(item: Board | Class | Subject | Chapter | Medium): string | number {
  return item.id || '';
}
