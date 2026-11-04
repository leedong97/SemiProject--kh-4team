import React, { useEffect, useState } from 'react';
import client from '../communityClient';
import { API_BASE } from '../../../shared/config';
import './CommunityInputs.css';

function StoredFile({ file, onRemove, disabled }) {
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!file.mimeType.startsWith('image/')) return undefined;
    let cancelled = false;
    let url;
    client.get(API_BASE + '/api/community-files/' + file.id, { responseType: 'blob' }).then(res => {
      if (cancelled) return;
      url = URL.createObjectURL(res.data);
      setPreview(url);
    }).catch(() => { if (!cancelled) setError('이미지를 불러오지 못했습니다. 다시 로그인 후 확인해주세요.'); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [file.id, file.mimeType]);

  async function download() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get(API_BASE + '/api/community-files/' + file.id, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError('다운로드하지 못했습니다. 로그인 상태를 확인해주세요.'); }
    finally { setLoading(false); }
  }
  return <li>
    {preview && <img className="dong-attachment-preview" src={preview} alt={file.name} />}
    <span className="dong-attachment-name">{file.name} ({Math.ceil(file.size / 1024)} KB)</span>
    <button type="button" className="dong-input-button" disabled={disabled || loading} onClick={download}>다운로드</button>
    {onRemove && <button type="button" className="dong-input-button" disabled={disabled} onClick={() => onRemove(file.id)}>첨부 삭제</button>}
    {error && <span role="alert">{error}</span>}
  </li>;
}

export default function StoredAttachments({ files = [], onRemove, disabled = false }) {
  if (!files.length) return null;
  return <section className="dong-community-input" aria-label="저장된 첨부파일"><ul className="dong-attachment-list">
    {files.map(file => <StoredFile key={file.id} file={file} onRemove={onRemove} disabled={disabled} />)}
  </ul></section>;
}
