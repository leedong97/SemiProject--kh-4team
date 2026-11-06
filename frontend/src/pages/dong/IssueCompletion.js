import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../../shared/config';
import getLoginUser from '../woojin/getLoginUser';
import { useDong } from './DongContext';
import './IssueCompletion.css';

async function request(path, method = 'GET', body) {
    const token = localStorage.getItem('nexus_auth_token');
    if (!token) throw new Error('로그인 후 이용해주세요. 기존 로그인 상태라면 다시 로그인해주세요.');
    const response = await fetch(API_BASE + '/api/dong/' + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '요청 처리에 실패했습니다.');
    return data;
}

export default function IssueCompletion({ admin = false, onReviewed }) {
    const dong = useDong();
    const [params] = useSearchParams();
    const [issueId, setIssueId] = useState(params.get('issueId') || '');
    const [resolution, setResolution] = useState('');
    const [issues, setIssues] = useState([]);
    const [requests, setRequests] = useState([]);
    const [comments, setComments] = useState({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [filter, setFilter] = useState(admin ? '대기' : '전체');
    const lock = useRef(false);
    const user = getLoginUser();
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await request(admin ? 'issue-completion-requests' : 'completion-context');
            setRequests(admin ? data : data.requests);
            if (!admin) setIssues(data.issues);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [admin]);
    useEffect(() => { load(); }, [load]);

    async function submit(event) {
        event.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true); setError(''); setNotice('');
        try {
            const data = await request('issue-completion-requests', 'POST', { issueId: Number(issueId), resolution });
            setNotice(data.message);
            setResolution(''); setIssueId('');
            await load();
        } catch (e) { setError(e.message); }
        finally { lock.current = false; setBusy(false); }
    }

    async function review(item, decision) {
        if (lock.current) return;
        const comment = comments[item.id] || '';
        if (decision === '반려' && !comment.trim()) { setError('반려 사유를 입력해주세요.'); return; }
        lock.current = true;
        setBusy(true); setError(''); setNotice('');
        try {
            const data = await request('issue-completion-requests/' + item.id, 'PATCH', { decision, comment });
            setNotice(data.message);
            if (dong) dong.setIssues(old => old.map(issue => String(issue.id) === String(data.issueId) ? { ...issue, status: data.issueStatus } : issue));
            if (onReviewed) onReviewed(data);
            await load();
        } catch (e) { setError(e.message); }
        finally { lock.current = false; setBusy(false); }
    }

    const available = issues.filter(issue => !Number(issue.pending));
    const chosen = available.find(issue => String(issue.id) === issueId);
    const visible = requests.filter(item => filter === '전체' || item.status === filter);
    return <section className="issue-completion">
        <div className="issue-completion-heading">
            <div><h2>{admin ? '이슈 완료 요청 검토' : '이슈 완료 요청'}</h2>
                <p>{admin ? '처리 내용을 확인하고 승인하거나 반려할 수 있습니다.' : '처리 내용을 제출하면 관리자 승인 후 이슈가 완료됩니다.'}</p></div>
            <button type="button" onClick={load} disabled={busy || loading}>새로고침</button>
        </div>
        {error && <p role="alert" className="issue-completion-error">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {loading && <p role="status">요청 내역을 불러오는 중입니다.</p>}
        {!admin && <form className="issue-completion-form" onSubmit={submit}>
            <label>요청자<input readOnly value={user.isDummy ? '로그인이 필요합니다' : `${user.name} (${user.empNo || user.id})`} /></label>
            <label>완료 요청할 이슈
                <select required value={issueId} onChange={event => setIssueId(event.target.value)} disabled={busy || loading || Boolean(error)}>
                    <option value="">이슈를 선택해주세요</option>
                    {available.map(issue => <option key={issue.id} value={issue.id}>{issue.projectName} / ISS-{issue.id} · {issue.title}</option>)}
                </select>
            </label>
            {!loading && !error && available.length === 0 && <p>요청할 수 있는 이슈가 없습니다. 완료된 이슈와 검토 대기 중인 이슈는 제외됩니다.</p>}
            {chosen && <p>현재 이슈 상태: {chosen.status}</p>}
            <label>처리 내용 및 확인 결과
                <textarea required rows={5} maxLength={5000} value={resolution} disabled={busy}
                    onChange={event => setResolution(event.target.value)} placeholder="어떤 문제를 어떻게 해결했는지와 확인 결과를 입력해주세요." />
            </label>
            <div className="issue-completion-actions">
                <button type="submit" disabled={busy || loading || !chosen || !resolution.trim()}>{busy ? '처리 중…' : '완료 요청 제출'}</button>
                <Link to="/issue">이슈 목록으로</Link>
            </div>
        </form>}
        <div className="issue-completion-heading">
            <h3>{admin ? '완료 요청 목록' : '내 완료 요청 내역'}</h3>
            <label>요청 상태 <select value={filter} onChange={event => setFilter(event.target.value)}>
                {['전체', '대기', '승인', '반려'].map(status => <option key={status}>{status}</option>)}
            </select></label>
        </div>
        {!loading && !error && !visible.length && <p>해당하는 완료 요청이 없습니다.</p>}
        {visible.map(item => <article className="issue-completion-item" key={item.id}>
            <h4><Link to={'/issue/' + item.issueId}>{item.projectName} / {item.title}</Link> <span>({item.status})</span></h4>
            <p>요청자: {item.requesterName} · 요청일: {new Date(item.createdAt).toLocaleString('ko-KR')}</p>
            <p className="issue-completion-text">{item.resolution}</p>
            {item.reviewedAt && <p>검토자: {item.reviewerName || '-'} · 처리일: {new Date(item.reviewedAt).toLocaleString('ko-KR')}</p>}
            {item.reviewComment && <p className="issue-completion-text">검토 의견: {item.reviewComment}</p>}
            {admin && item.status === '대기' && <div>
                <label>검토 의견 (반려 시 필수)<textarea rows={2} maxLength={2000} disabled={busy}
                    value={comments[item.id] || ''} onChange={event => setComments(old => ({ ...old, [item.id]: event.target.value }))} /></label>
                <div className="issue-completion-actions">
                    <button type="button" disabled={busy} onClick={() => review(item, '승인')}>승인하고 완료 처리</button>
                    <button type="button" disabled={busy} onClick={() => review(item, '반려')}>반려</button>
                </div>
            </div>}
        </article>)}
    </section>;
}
