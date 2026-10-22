# NEXUS ERP — project12 실행용

## Windows / Cursor에서 실행

1. 이 ZIP의 **내용물 전체**를 `C:\react\project12` 폴더에 압축 해제합니다. 압축을 풀었을 때 `C:\react\project12\package.json`이 존재해야 합니다.
2. Cursor에서 `C:\react\project12` 폴더를 엽니다.
3. CMD 터미널에서 실행합니다.

```cmd
cd /d C:\react\project12
dir package.json
npm install
npm start
```

4. `http://localhost:3000`에 접속합니다.

데모 로그인: `admin@demo.local` / `Demo1234!`

**MySQL과 별도의 API 서버가 필요하지 않습니다.** 데이터는 브라우저 localStorage에 저장됩니다. 실제 보안 인증 기능이 아니므로 실데이터를 넣지 마세요.

## 수정 및 점검

- ZIP 내부의 최상위 폴더를 없애고 `package.json`, `src`, `public`이 바로 보이도록 정리했습니다. 이전 `ENOENT` 오류를 방지하기 위한 수정입니다.
- `public/index.html`을 한국어 ERP 제목으로 정리했습니다. React는 이 파일의 `root` 영역에 표시됩니다.
- 루트의 기존 `index.html`은 `index_기존_참고용.html`로 이름을 변경했습니다. Create React App의 실행 화면과 혼동하지 않기 위해서입니다.
- 기존 컴포넌트 `.js` 및 스타일 파일을 유지했습니다.
- 모든 `src/*.js`의 JavaScript/JSX 구문을 정적 파서로 검사했습니다.

## 오류가 계속된다면

- `ENOENT package.json`: 압축 해제 위치를 확인하세요.
- `react-scripts is not recognized`: `npm install`이 정상 완료되었는지 확인하세요.
- 포트 3000 사용 중: 다른 포트로 실행할지 터미널 질문에 답하세요.
- 빈 화면: 브라우저 F12 > Console의 첫 번째 빨간 오류를 확인하세요.

## 검증 범위

파일 구조, package.json 스크립트, JSX 구문을 검사했습니다. 이 실행 환경에서는 npm 패키지 다운로드가 캐시에 없어 `npm install`과 실제 브라우저 실행을 끝까지 검증하지 못했습니다.
