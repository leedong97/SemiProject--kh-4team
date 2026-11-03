import React, { useState } from "react";

function PostForm(props) {

    const [title, setTitle] = useState(props.post.title);
    const [content, setContent] = useState(props.post.content);

    function changeTitle(event) {
        setTitle(event.target.value);
    }

    function changeContent(event) {
        setContent(event.target.value);
    }

    function savePost(event) {
        event.preventDefault();

        if (props.isSaving) {
            return;
        }

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (trimmedTitle === "") {
            alert("제목을 입력해주세요.")
            return;
        }

        if (trimmedTitle.length > 200) {
            alert("제목은 200자까지 입력할 수 있습니다.")
            return;
        }

        if (trimmedContent === "") {
            alert("내용을 입력해주세요.")
            return;
        }

        if (trimmedContent.length > 10000) {
            alert("내용은 10000자까지 입력할 수 있습니다.")
            return;
        }

        props.onSave(trimmedTitle, trimmedContent);

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
                    placeholder="제목을 입력하세요."
                    maxLength={200}
                    aria-describedby="community-title-count"
                    disabled={props.isSaving}
                />

                <p id="community-title-count">
                    {title.length} / 200자
                </p>

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
                    placeholder="내용을 입력하세요."
                    maxLength={10000}
                    aria-describedby="community-content-count"
                    disabled={props.isSaving}
                />

                <p id="community-content-count">
                    {content.length} / 10000자
                </p>

                <div className="community-actions">
                    <button
                        type="submit"
                        className="community-primary-button"
                        disabled={props.isSaving}
                    >
                        {props.isSaving ? "저장 중…" : "저장"}
                    </button>

                    <button
                        type="button"
                        className="community-button"
                        onClick={props.onCancel}
                        disabled={props.isSaving}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>

    );
}

export default PostForm;