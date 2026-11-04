import React, { useState } from "react";

import FileAttachment from '../dong/components/FileAttachment';
import AnonymousToggle from '../dong/components/AnonymousToggle';
import StoredAttachments from '../dong/components/StoredAttachments';

function PostForm(props) {

    const [title, setTitle] = useState(props.post.title);
    const [content, setContent] = useState(props.post.content);
    const [files, setFiles] = useState([]);
    const [isAnonymous, setIsAnonymous] = useState(!!props.post.isAnonymous);
    const [removeAttachmentIds, setRemoveAttachmentIds] = useState([]);
    const [saving, setSaving] = useState(false);

    function changeTitle(event) {
        setTitle(event.target.value);
    }

    function changeContent(event) {
        setContent(event.target.value);
    }

    async function savePost(event) {
        event.preventDefault();

        if (title.trim() === "") {
            alert("제목을 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("내용을 입력해주세요.");
            return;
        }

        if (saving) return;
        setSaving(true);
        try { await props.onSave(title.trim(), content.trim(), { files, isAnonymous, removeAttachmentIds }); }
        finally { setSaving(false); }
    }

    let formTitle = "글쓰기";

    if (props.post.id !== null) {
        formTitle = "글 수정";
    }

    return (

        <div className="community-panel">
            <h2 className="community-panel-title">
                {formTitle}
            </h2>

            <form onSubmit={savePost}>
                <label
                    className="community-label"
                    htmlFor="community-post-title"
                >
                    제목
                </label>

                <input
                    id="community-post-title"
                    className="community-input"
                    type="text"
                    value={title}
                    onChange={changeTitle}
                    placeholder="제목을 입력하세요"
                />

                <label
                    className="community-label"
                    htmlFor="community-post-content"
                >
                    내용
                </label>

                <textarea
                    id="community-post-content"
                    className="community-textarea"
                    value={content}
                    onChange={changeContent}
                    placeholder="내용을 입력하세요"
                />

                <AnonymousToggle checked={isAnonymous} onChange={setIsAnonymous} anonymousNumber={props.post.anonymousNumber} disabled={saving} />
                <StoredAttachments files={(props.post.attachments || []).filter(f => !removeAttachmentIds.includes(f.id))} onRemove={id => setRemoveAttachmentIds(old => [...old, id])} disabled={saving} />
                <FileAttachment files={files} onChange={setFiles} disabled={saving} />
                <p>파일당 5MB, 총 10MB, 최대 5개까지 첨부할 수 있습니다.</p>
                <div className="community-actions">
                    <button
                        type="submit" disabled={saving}
                        className="community-primary-button"
                    >
                        저장
                    </button>

                    <button
                        type="button"
                        className="community-button"
                        onClick={props.onCancel}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>

    );
}

export default PostForm;