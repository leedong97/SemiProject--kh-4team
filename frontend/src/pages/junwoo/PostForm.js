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

        if (title.trim() === "") {
            alert("제목을 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("내용을 입력해주세요.");
            return;
        }

        props.onSave(title.trim(), content.trim());
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

                <div className="community-actions">
                    <button
                        type="submit"
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