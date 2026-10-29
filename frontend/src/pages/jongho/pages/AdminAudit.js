import React, { useEffect, useState } from 'react';
import { adminRequest } from '../adminApi';
export default function AdminAudit() {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        adminRequest('/audit-logs').then(setLogs).catch(err => setError(err.message));
    }, []);
    return <div className="nexus-extra-page">
        <div className="nexus-extra-heading"><span>SECURITY / AUDIT</span><h1>관리자 감사 로그</h1><p>서버에 저장된 최근 100개의 프로젝트 변경 기록입니다.</p></div>
        {error && <p className="nexus-alert">{error}</p>}
        <div className="card nexus-table-card"><table className="nexus-simple-table"><thead><tr><th>번호</th><th>관리자 ID</th><th>작업</th><th>대상 ID</th><th>기록 시간</th></tr></thead><tbody>
            {logs.map(log => <tr key={log.id}><td>{log.id}</td><td>{log.adminId}</td><td>{log.action}</td><td>{log.targetId || '-'}</td><td>{new Date(log.createdAt).toLocaleString('ko-KR')}</td></tr>)}
            {!logs.length && <tr><td colSpan="5">표시할 기록이 없습니다.</td></tr>}
        </tbody></table></div>
    </div>;
}
