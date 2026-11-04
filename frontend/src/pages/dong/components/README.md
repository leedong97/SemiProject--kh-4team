# 커뮤니티 첨부·익명 기능 (화면/API/DB 연결 완료)

## 사용 방법
- 자유게시판·질문 답변·정보공유 글 작성/수정에서 파일 첨부와 익명 사용 선택.
- 댓글·답글 작성/수정에도 동일하게 사용.
- 선택한 파일은 등록/저장 성공 시 DB에 저장. 상세 화면에서 이미지 미리보기와 다운로드 제공.
- 기존 첨부 삭제는 수정 화면에서 선택하고 저장해야 반영.
- 파일당 5MB, 글/댓글당 최대 5개·합계 10MB. 저장 요청의 파일 데이터는 JSON Base64로 전달.
- 같은 게시글에서 같은 사용자의 익명 번호 유지. 글 작성자와 댓글 작성자도 같은 번호 공유.
- 익명 번호는 최초 익명 등록 시 서버가 부여. 다른 게시글에서는 별도 번호.
- 익명 사용을 끄고 저장하면 실명으로 표시됩니다. 익명 글의 본인에게는 수정 권한 판단용 ID가 반환되며 다른 사용자에게는 반환되지 않습니다.

## 공통 컴포넌트
- FileAttachment: files/onChange로 새 File 목록 관리.
- AnonymousToggle: checked/onChange로 익명 선택 관리, anonymousNumber로 기존 번호 표시.
- StoredAttachments: 서버가 반환한 attachments 표시·인증된 다운로드. onRemove는 저장 전 삭제 목록에만 반영.
- ../communityClient.js: 로그인 토큰 전송과 encodeAttachments(File[]) 제공.

## 저장 API
- POST/PUT /api/community: title, content, boardName(신규), isAnonymous, files, removeAttachmentIds(수정).
- POST/PUT /api/community-comments: postId(신규), parentId(답글), content, isAnonymous, files, removeAttachmentIds.
- files 항목: { name, base64 }. 모든 파일 추가·제거와 본문 변경은 같은 트랜잭션으로 처리.
- GET /api/community-files/:id: 로그인 토큰 필요. 이미지 바이트를 검사하고 HTML/SVG 등은 실행하지 않고 다운로드로 제공.
- 모든 커뮤니티 글·댓글 읽기/쓰기와 파일 다운로드는 유효한 로그인 토큰 필요.
- 실제 작성자는 서버 토큰으로 확인. 요청 본문 authorId를 권한의 근거로 쓰지 않습니다.

## 팀원 DB 반영
프로젝트 최신 코드와 아래 마이그레이션을 함께 전달하세요.
backend 폴더에서 실행: node members/dong/migrate-community.js
루트 .env의 기존 DB 설정 사용. 기존 글/댓글 보존. 반복 실행 시 없는 컬럼/테이블만 생성.

추가 테이블:
- community_anonymous: 게시글+직원별 익명 번호. 게시글 행 잠금과 고유 키로 동시 중복 방지.
- community_attachment: 파일 메타데이터와 LONGBLOB 원본. 글/댓글 삭제 시 외래키로 정리.
- community_session: 로그인 토큰 해시와 12시간 만료 시각. 원본 토큰은 DB에 저장하지 않음.

추가 컬럼:
- community_post.is_anonymous
- community_comment.is_anonymous
- community_comment.parent_id / is_deleted (없는 경우에만 추가)

서버를 재시작한 후 다시 로그인해야 새 토큰을 받을 수 있습니다.
파일 원본도 DB에 저장되므로 DB 백업에 첨부파일이 포함됩니다.
기존 준우 게시글/댓글 라우터 대신 dong/communityService.js가 같은 URL을 처리하며, 좋아요는 기존 기능을 사용합니다.
