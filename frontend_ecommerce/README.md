# NEXUS SOLUTIONS 데모 — React 컴포넌트 분리본

원본의 한 파일짜리 HTML/CSS/JavaScript를 **React 컴포넌트와 페이지**로 나누고, 학습을 위한 **한국어 주석**을 넣었습니다. 서비스 유형 전환, 상품 상세, 견적 폼, 서비스 이용 절차, 신청 완료 화면을 유지합니다.

## 실행 방법

Node.js 설치 후 이 폴더에서 터미널을 열고 아래 명령을 실행하세요.

```bash
npm install
npm run dev
```

명령 결과에 나온 로컬 주소(보통 http://localhost:5173)를 브라우저에서 엽니다. 프로덕션 빌드는 `npm run build`입니다.

## 폴더 구조

```text
nexus-solutions-react/
├─ index.html               # 실제 HTML 시작 문서
├─ package.json             # 프로젝트 실행 및 의존성
├─ vite.config.js           # JSX 변환을 위한 React 플러그인 설정
└─ src/
   ├─ main.jsx             # React 진입점
   ├─ App.jsx              # 전체 상태/화면 전환 관리
   ├─ data/
   │  └─ services.js       # 상품, 절차, ERP 소개 데이터
   ├─ components/
   │  ├─ Header.jsx        # 공통 상단 네비게이션
   │  ├─ ServiceTabs.jsx   # 업무 시스템 / 클라우드 전환 버튼
   │  ├─ Footer.jsx        # 공통 하단 영역
   │  ├─ ProductCard.jsx   # 재사용 상품 카드
   │  ├─ Hero.jsx          # 홈 상단 소개 배너
   │  ├─ NoticeBanner.jsx  # 공통 견적 유도 안내
   │  ├─ Breadcrumb.jsx    # 현재 위치 표시
   │  └─ ServiceSteps.jsx  # 상세 페이지 진행 단계
   ├─ pages/
   │  ├─ HomePage.jsx      # 상품 목록(메인)
   │  ├─ DetailPage.jsx    # 선택한 서비스 상세
   │  ├─ QuotePage.jsx     # 견적 신청 / 데모 완료
   │  └─ FlowPage.jsx      # 서비스 이용 절차와 ERP 연동 소개
   └─ styles/
      └─ main.css          # 기존 디자인 CSS
```

## 원본 코드와 달라진 점

- `let type`, `let view`, `let selected`, `let submitted` → `useState` 상태로 변경했습니다.
- `app.innerHTML = ...`, 문자열로 HTML 생성 → JSX로 변경했습니다.
- `onclick="route(...)"` → `onClick={() => navigate(...)}`로 변경했습니다.
- `class` → `className`, `for` → `htmlFor`, `style="..."` → `style={{ ... }}`로 변경했습니다.
- 원본 배열 데이터 `p[0]`, `p[1]` → `product.icon`, `product.name` 등 의미 있는 객체 속성으로 변경했습니다.
- 원본에서 `return` 뒤에 줄바꿈을 둔 `home()` 함수는 JS 자동 세미콜론 삽입 때문에 의도대로 HTML을 반환하지 못할 수 있었는데, React 컴포넌트는 `return (` 형태로 정리했습니다.
- URL의 `#home`, `#detail-0`, `#quote`, `#flow`를 유지하고, 브라우저 뒤로 가기 시 화면을 동기화합니다.
- 실제 API/DB 연결은 원본과 동일하게 **구현하지 않았습니다**. 견적 신청은 제출 성공 화면만 보여주는 시연용입니다.

## 핵심 흐름

1. `App.jsx`에서 `type`을 선택합니다.
2. `serviceData[type]`에서 현재 유형의 상품 목록을 얻습니다.
3. `HomePage`가 `ProductCard`를 반복 출력합니다.
4. 카드의 상세 보기 클릭 → `navigate("detail", index)` → `DetailPage` 표시.
5. 견적 클릭 → `navigate("quote")` → `QuotePage` 표시.
6. 필수값 입력 후 제출 → `submitQuote()` → `submitted = true` → 완료 화면.

## 참고

원본 CSS의 클래스 이름과 레이아웃을 유지하고, 원본에서 사용한 데모 데이터와 가격을 옮겼습니다. 개발 서버는 기존 COMMAND ERP의 React 포트(3000), Express 포트(5000)과 별개의 데모(Vite 기본 5173)로 실행됩니다. 기존 프로젝트에 병합하려면 별도 포트로 실행하는 대신 컴포넌트와 스타일을 현재 프로젝트 `src` 아래로 복사한 후 라우트를 조정하세요.

## 공부할 때 먼저 볼 파일

**1. `src/App.jsx`**: `useState()`로 어떤 화면과 상품이 선택됐는지 기억하고, `navigate()` 함수로 화면을 변경합니다.

**2. `src/data/services.js`**: 화면 코드를 고치지 않고 상품 이름, 설명, 가격, 기능 목록을 수정할 수 있습니다.

**3. `src/pages/HomePage.jsx` + `src/components/ProductCard.jsx`**: 부모가 `map()`으로 카드를 반복 만들고, 자식에게 `product`와 `onDetail`을 props로 전달합니다.

**4. `src/pages/QuotePage.jsx`**: `submitted` 값에 따라 입력 폼 또는 완료 메시지를 조건부로 보여 줍니다. `required`와 `type="email"`로 기본 브라우저 검증을 사용합니다.

## 실행 점검 참고

이 코드는 JSX 구성, import 경로, 데이터 구조 등을 점검하여 구성했습니다. 파일을 만든 환경에서 npm 패키지를 받아오지 못했기 때문에 **실제 `npm run build` 완료 여부는 확인하지 못했습니다**. 인터넷에 연결된 개발 PC에서 `npm install` 후 `npm run build`로 최종 확인해 주세요.
