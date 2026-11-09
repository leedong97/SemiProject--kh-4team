import { useState } from 'react';

export default function useSortableList(getSortValue) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function changeSort(key) {
    if (sortKey === key) {
      setSortDir((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDir('asc');
  }

  function sortItems(items) {
    if (!sortKey) return [...items];

    return [...items].sort((left, right) => {
      const leftValue = getSortValue(left, sortKey);
      const rightValue = getSortValue(right, sortKey);
      const result = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), 'ko');

      return sortDir === 'asc' ? result : -result;
    });
  }

  function sortMark(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  return { sortKey, sortDir, changeSort, sortItems, sortMark };
}
