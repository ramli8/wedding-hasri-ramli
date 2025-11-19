import { FilterFn } from '@tanstack/react-table';

export const fuzzyFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (!filterValue || !value) return true;
  return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
};

export const dateFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (!filterValue || !value) return true;

  // Convert to strings first to ensure compatibility, then to dates
  let rowDateValue: Date;
  let filterDateValue: Date;

  // Try to convert the values to dates
  try {
    rowDateValue = new Date(String(value));
    filterDateValue = new Date(String(filterValue));
  } catch {
    return false; // If conversion fails, don't match
  }

  // Check if the dates are valid
  if (isNaN(rowDateValue.getTime()) || isNaN(filterDateValue.getTime())) {
    return false; // If not valid dates, don't match
  }

  // Compare just the date part (not time)
  const rowDateString = rowDateValue.toDateString();
  const filterDateString = filterDateValue.toDateString();

  return rowDateString === filterDateString;
};

export const arrIncludes: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (!filterValue || filterValue.length === 0) return true;
  return filterValue.includes(value);
};