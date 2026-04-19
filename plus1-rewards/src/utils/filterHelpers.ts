// Filter Helper Functions
import { FilterValues } from '../components/dashboard/AdvancedFilters';

export function applyFilters<T>(
  data: T[],
  filterValues: FilterValues,
  filterConfig: {
    [key: string]: (item: T, value: any) => boolean;
  }
): T[] {
  return data.filter((item) => {
    return Object.entries(filterValues).every(([key, value]) => {
      // Skip empty filters
      if (value === '' || value === null || value === undefined) return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const hasValues = Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
        if (!hasValues) return true;
      }

      // Apply the filter function
      const filterFn = filterConfig[key];
      return filterFn ? filterFn(item, value) : true;
    });
  });
}

export function countActiveFilters(filterValues: FilterValues): number {
  return Object.entries(filterValues).filter(([key, value]) => {
    if (value === '' || value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
    }
    return true;
  }).length;
}

// Common filter functions
export const commonFilters = {
  textMatch: (text: string | null | undefined, searchValue: string): boolean => {
    if (!text) return false;
    return text.toLowerCase().includes(searchValue.toLowerCase());
  },

  dateInRange: (date: string | Date, range: { from?: string; to?: string }): boolean => {
    const itemDate = new Date(date);
    if (range.from && itemDate < new Date(range.from)) return false;
    if (range.to && itemDate > new Date(range.to)) return false;
    return true;
  },

  numberInRange: (num: number, range: { from?: string; to?: string }): boolean => {
    const value = Number(num);
    if (range.from && value < Number(range.from)) return false;
    if (range.to && value > Number(range.to)) return false;
    return true;
  },

  arrayIncludes: (itemValue: string, selectedValues: string[]): boolean => {
    return selectedValues.includes(itemValue);
  }
};
