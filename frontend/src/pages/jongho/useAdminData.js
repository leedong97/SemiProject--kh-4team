import { useEffect, useState } from 'react';
import { adminRequest } from './adminApi';
import { initialData } from './initialData';

export default function useAdminData() {
  const [data, setData] = useState(initialData);

  // 서버에서 직원·평가·이슈를 다시 불러온다 (앱이 켜질 때와 관리자 화면에 들어올 때 호출)
  async function reloadData() {
    const collections = ['employees', 'evaluations', 'issues'];

    for (const collection of collections) {
      try {
        const rows = await adminRequest('/' + collection);
        if (Array.isArray(rows)) {
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

  useEffect(() => {
    reloadData();
  }, []);

  function changeData(action, updater) {
    setData((previous) => {
      const next = updater(previous);
      const logs = [
        {
          id: Date.now() + Math.random(),
          action,
          at: new Date().toLocaleString('ko-KR'),
        },
        ...previous.logs,
      ].slice(0, 100);

      return { ...next, logs };
    });
  }

  return { data, changeData, reloadData };
}
