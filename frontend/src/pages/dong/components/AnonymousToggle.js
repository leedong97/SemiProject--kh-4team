import React, { useId } from 'react';
import './CommunityInputs.css';

// 같은 게시글의 사용자별 번호는 서버에서 정하고 부모가 전달합니다.
export default function AnonymousToggle({ checked = false, onChange, anonymousNumber, disabled = false }) {
  const descriptionId = useId();
  const hasNumber = Number.isSafeInteger(anonymousNumber) && anonymousNumber > 0;
  const nickname = hasNumber ? '익명' + anonymousNumber : '익명';

  return (
    <div className="dong-community-input dong-anonymous">
      <button
        type="button"
        className="dong-input-button dong-anonymous-button"
        aria-pressed={checked}
        aria-describedby={descriptionId}
        disabled={disabled || typeof onChange !== 'function'}
        onClick={() => onChange(!checked)}
      >
        익명 사용
      </button>
      <span id={descriptionId} className="dong-input-help" role="status">
        {checked ? (hasNumber ? nickname + '으로 등록합니다.' : '익명으로 등록합니다. 번호는 등록 시 부여됩니다.') : '익명 사용이 꺼져 있습니다.'}
      </span>
    </div>
  );
}
