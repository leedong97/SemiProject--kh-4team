import React from 'react';
import { useJongho } from '../JonghoContext';
export default function Workload() {
    const { data, projects } = useJongho();
    const employees = data.employees.filter(e => e.status === '재직').map(e => ({
        ...e,
        projects: projects.filter(p => String(p.managerId) === String(e.id) && p.status !== '완료').length,
        issues: data.issues.filter(i => String(i.assigneeId) === String(e.id) && i.status !== '완료').length
    })).sort((a,b) => (b.projects+b.issues)-(a.projects+a.issues));
    const max = Math.max(1, ...employees.map(e => e.projects + e.issues));
    return <div className="nexus-extra-page"><div className="nexus-extra-heading"><span>PEOPLE / CAPACITY</span><h1>직원별 업무량 분석</h1><p>담당 프로젝트와 미완료 이슈 건수를 비교합니다. 업무 시간 기반의 실제 부하율은 아닙니다.</p></div>
        <div className="card nexus-workload-list">{employees.map(e => <div className="nexus-workload-row" key={e.id}>
            <div className="nexus-workload-name"><strong>{e.name}</strong><small>{e.team || '미지정'} · {e.rank || '직급 미정'}</small></div>
            <div className="nexus-workload-chart"><div className="nexus-workload-track"><div style={{width: (e.projects + e.issues) / max * 100 + '%'}} /></div><small>프로젝트 {e.projects}건 / 이슈 {e.issues}건</small></div>
            <strong>{e.projects + e.issues}건</strong>
        </div>)}{!employees.length && <p>직원 데이터가 없습니다.</p>}</div>
    </div>;
}
