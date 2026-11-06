import React, { useEffect, useId, useRef, useState } from 'react';
import './CommunityInputs.css';

function ImagePreview({ file }) {
    const [url, setUrl] = useState('');
    useEffect(() => {
        const next = URL.createObjectURL(file);
        setUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [file]);
    return url ? <img className="dong-attachment-preview" src={url} alt={file.name + ' 미리보기'} /> : null;
}

// files는 부모가 관리하는 File[]입니다. 업로드는 부모의 등록 처리에서 수행합니다.
export default function FileAttachment({ files = [], onChange, accept, multiple = true, disabled = false }) {
    const inputRef = useRef(null);
    const descriptionId = useId();
    const inactive = disabled || typeof onChange !== 'function';

    function selectFiles(event) {
        const selected = Array.from(event.target.files || []);
        // 같은 파일을 제거한 뒤 다시 선택할 수 있도록 초기화합니다.
        event.target.value = '';
        if (inactive || selected.length === 0) return;
        if (!multiple) {
            onChange(selected.slice(0, 1));
            return;
        }
        const next = [...files];
        selected.forEach(file => {
            const duplicate = next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified && item.type === file.type);
            if (!duplicate) next.push(file);
        });
        onChange(next);
    }

    return (
        <section className="dong-community-input dong-attachments" aria-label="파일 첨부">
            <input ref={inputRef} type="file" hidden accept={accept} multiple={multiple} disabled={inactive} onChange={selectFiles} />
            <button type="button" className="dong-input-button" disabled={inactive} aria-describedby={descriptionId} onClick={() => inputRef.current?.click()}>
                파일 첨부
            </button>
            <p id={descriptionId} className="dong-input-help" role="status">
                {files.length ? '선택한 파일 ' + files.length + '개 · 등록 시 첨부됩니다.' : '컴퓨터에서 이미지나 파일을 선택하세요.'}
            </p>
            {files.length > 0 && (
                <ul className="dong-attachment-list">
                    {files.map((file, index) => (
                        <li key={[file.name, file.size, file.lastModified, index].join('-')}>
                            {file.type.startsWith('image/') && <ImagePreview file={file} />}
                            <span className="dong-attachment-name">{file.name} <small>({Math.max(1, Math.ceil(file.size / 1024))} KB)</small></span>
                            <button type="button" className="dong-input-button" disabled={inactive} aria-label={file.name + ' 첨부 취소'} onClick={() => onChange(files.filter((_, itemIndex) => itemIndex !== index))}>제거</button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
