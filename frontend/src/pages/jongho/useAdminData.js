import { useEffect, useState } from 'react';
import { adminRequest } from './adminApi';
import { initialData } from './initialData';

export default function useAdminData() {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let cancelled = false;

    async function loadFromServer() {
      const collections = ['employees', 'evaluations', 'issues'];

      for (const collection of collections) {
        try {
          const rows = await adminRequest('/' + collection);
          if (!cancelled && Array.isArray(rows)) {
            const items = collection === 'issues'
              ? rows.map((issue) => ({ comments: [], history: [], ...issue }))
              : rows;

            setData((previous) => ({ ...previous, [collection]: items }));
          }
        } catch (error) {
          console.error(collection + ' 목록 오류:', error.message);
        }
      }
    }

    loadFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  function changeData(action, updater) {
    setData((previous) => {
      const next = updater(previous);
      // 감사 로그 화면을 제거했으므로 별도 로그 배열을 추가하지 않습니다.
      return next;
    });
  }

  function resetData() {
    localStorage.removeItem('it_erp_react_demo_v1');
    setData(initialData);
  }

  return { data, changeData, resetData };
}
