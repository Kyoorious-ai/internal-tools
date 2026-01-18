// API Service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://0.0.0.0:8000';

export interface Board {
  id: number;
  name?: string;
  [key: string]: any;
}

export interface Class {
  id: number;
  name?: string;
  [key: string]: any;
}

export interface Subject {
  id: number;
  name?: string;
  [key: string]: any;
}

export interface Chapter {
  id: number;
  name?: string;
  [key: string]: any;
}

export interface Medium {
  id: number;
  name?: string;
  [key: string]: any;
}

export interface DropdownData {
  boards: Board[];
  classes: Class[];
  subjects: Subject[];
  chapters: Chapter[];
  mediums: Medium[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Fetch all boards from the API
 */
export async function fetchBoards(): Promise<Board[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supabase/boards`);
    if (!response.ok) {
      throw new Error(`Failed to fetch boards: ${response.status}`);
    }
    const result: ApiResponse<Board[]> = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch boards');
  } catch (error) {
    console.error('Error fetching boards:', error);
    throw error;
  }
}

/**
 * Fetch all classes from the API
 */
export async function fetchClasses(): Promise<Class[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supabase/classes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }
    const result: ApiResponse<Class[]> = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch classes');
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}

/**
 * Fetch all subjects from the API
 */
export async function fetchSubjects(): Promise<Subject[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supabase/subjects`);
    if (!response.ok) {
      throw new Error(`Failed to fetch subjects: ${response.status}`);
    }
    const result: ApiResponse<Subject[]> = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch subjects');
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
}

/**
 * Fetch all chapters from the API
 */
export async function fetchChapters(): Promise<Chapter[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supabase/chapters`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.status}`);
    }
    const result: ApiResponse<Chapter[]> = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch chapters');
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
}

/**
 * Fetch all mediums from the API
 */
export async function fetchMediums(): Promise<Medium[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supabase/mediums`);
    if (!response.ok) {
      throw new Error(`Failed to fetch mediums: ${response.status}`);
    }
    const result: ApiResponse<Medium[]> = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch mediums');
  } catch (error) {
    console.error('Error fetching mediums:', error);
    throw error;
  }
}

/**
 * Fetch all dropdown data in a single call
 * This is more efficient than making multiple separate calls
 */
export async function fetchAllDropdownData(): Promise<DropdownData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/supabase/dropdowns`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dropdown data: ${response.status}`);
    }
    const result: ApiResponse<DropdownData> = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to fetch dropdown data');
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    throw error;
  }
}
