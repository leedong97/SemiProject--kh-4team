import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Todo_set({onAddTodo}){

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const navigate = useNavigate();

    const addTodo = () => {

        if( !title.trim() ){
            alert('프로젝트 제목을 입력하세요.')
            return;
        } else if( !content.trim() ){
            alert('프로젝트 내용을 입력하세요.')
            return;
        } else {
            onAddTodo(title.trim(), content.trim());
            navigate('/todo');
        }
    }

    return(

        <div className="todo-set-page">
            
            <h2>프로젝트 작성</h2>

            <input type="text"
                placeholder="제목 입력"
                value={title}
                onChange={(e) => setTitle(e.target.value)}/>

            <textarea placeholder="내용 입력"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}/>

            <button onClick={addTodo}>
                등록
            </button>

        </div>

    );
}


export default Todo_set;