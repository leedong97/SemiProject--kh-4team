// 관리자 화면을 구현하는 팀원이 참고할 수 있는 연결 예시입니다.
// 실제 프로젝트 라우트와 폴더 구조에 따라 import 경로를 변경하세요.
// 중요: 반드시 JunwooProvider 내부에서 렌더링되어야 합니다.
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NoticeAdminPanel from "./NoticeAdminPanel";
import { useJunwoo } from "../junwoo/JunwooContext";

function AdminNoticesPage() {
  const { info, addInfo, delInfo, pinInfo } = useJunwoo();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEventDate = location.state?.eventDate || "";

  return (
    <NoticeAdminPanel
      info={info}
      onAddInfo={addInfo}
      onDeleteInfo={delInfo}
      onPinInfo={pinInfo}
      initialEventDate={initialEventDate}
      onOpenNotice={(id) => navigate(`/info/${id}`)}
      onAfterAdd={(id) => navigate(`/info/${id}`)}
    />
  );
}

export default AdminNoticesPage;
