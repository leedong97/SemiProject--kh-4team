---
name: COMMAND ERP
description: 하루를 출발 시각표로 읽는 직원용 사내 ERP
colors:
  ground: "#e9ebee"
  panel: "#ffffff"
  panel-2: "#f2f3f5"
  panel-3: "#e3e6ea"
  ink: "#14171c"
  ink-2: "#343a43"
  mute: "#5a606a"
  faint: "#8b919b"
  rule: "#dcdfe4"
  rule-2: "#c3c8cf"
  board-bg: "#14171c"
  board-row: "#1d2128"
  board-rule: "#2c313a"
  board-ink: "#e9ebee"
  board-mute: "#9aa1ad"
  board-lamp-ok: "#51cf66"
  accent: "#f2a900"
  accent-ink: "#14171c"
  accent-text: "#8a5d00"
  accent-tint: "#fdf3d6"
  lamp-ok: "#2f9e44"
  lamp-late: "#d9480f"
  lamp-done: "#8b919b"
  green-text: "#237032"
  red-text: "#b33a0b"
  sky-text: "#1864ab"
  red-tint: "#fbe9e1"
  cat-work: "#1c7ed6"
  cat-personal: "#f08c00"
  cat-leave: "#e64980"
  cat-project: "#2f9e44"
  cat-notice: "#7048e8"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  panel-title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.02em"
    fontFeature: "\"tnum\" 1"
rounded:
  none: "0"
  sm: 10px
  md: 10px
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "20px"
  sp-6: "24px"
  sp-8: "32px"
  sp-10: "40px"
components:
  button:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  code-label:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "0 6px"
    height: "22px"
  chip:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.mute}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "22px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px 24px"
  departure-board:
    backgroundColor: "{colors.board-bg}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.md}"
    padding: "20px 24px 16px"
  top-bar:
    backgroundColor: "{colors.board-bg}"
    textColor: "{colors.board-ink}"
    height: "60px"
  notification-count:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    height: "20px"
---

# Design System: COMMAND ERP

## Overview

**Creative North Star: "출발 안내판"**

역과 버스터미널의 출발 시각표처럼, 하루의 일정과 업무를 시각·구분·일정·상태 열에 맞춰 세운다. 콘크리트 회색 바탕 위에 흰 작업판을 놓고, 잉크 글자와 1px 괘선으로 정보를 나눈다. 꾸밈은 없고, 읽는 순서가 곧 디자인이다. 화면을 열면 "다음 출발"(다음 일정) 한 줄을 먼저 읽고, 그다음 오늘 시각표, 내 프로젝트 코드표, 달력 순으로 내려간다.

어두운 안내판은 대시보드의 "오늘 일정" 한 곳에만 쓴다. 상단 띠도 검정이지만 그것은 틀이고, 본문 안에서 어두운 면은 하나뿐이다. 앰버(#f2a900)는 "지금 여기"를 가리키는 유일한 색이라 현재 메뉴, 다음 출발 시각, 선택된 날짜, 알림 수에만 나타난다. 상태는 작은 네모 상태등과 글자로, 숫자·시각·코드는 고정폭 탭 숫자로 쓴다.

둥근 카드 대시보드와 연파랑 SaaS 템플릿은 이 세계가 거부한 출발점이다. 관제실처럼 화면 전체를 어둡게 칠하는 것도 거부한다. 이전 세계(지하철 노선도)는 `.impeccable/backup-subway/`에 보관되어 있다.

**Key Characteristics:**
- 회색 바탕(#e9ebee) 위 흰 작업판, 둥근 모서리 10px, 그림자 없음
- 1px 괘선으로 행을 나누고, 머리줄과 표 머리는 더 굵은 잉크 괘선(2~3px)
- 앰버는 현재·다음·선택에만
- 시각·코드·숫자는 JetBrains Mono 탭 숫자, 본문은 Pretendard
- 프로젝트는 PRJ-012 같은 코드표가 첫 식별자
- 상태는 8px 네모 상태등 + 글자 (예정·진행 초록, 지연 주황, 완료 회색)
- 달력은 종류별 색 점을 그대로 유지

## Colors

차가운 콘크리트 회색과 잉크 위에 앰버 하나만 신호로 올리는 팔레트다. 나머지 색은 상태등과 일정 종류 점이라는 정해진 역할만 맡는다.

### Primary
- **안내판 앰버** (accent): 현재 메뉴 4px 밑줄, 다음 출발 시각, 보드의 시각 열, 선택된 날짜 숫자, 알림 수 바탕, 로고 네모, 텍스트 선택 바탕. 흰 바탕 위 글자로 쓸 때는 **짙은 앰버**(accent-text)를 쓰고, 옅은 면이 필요할 때는 **앰버 옅은 면**(accent-tint)을 쓴다. 앰버 위 글자는 항상 잉크(accent-ink).

### Secondary
- **상태등 초록** (lamp-ok): 예정·진행 중. 흰 바탕 글자는 green-text, 어두운 보드 위에서는 더 밝은 **보드 초록**(board-lamp-ok).
- **상태등 주황** (lamp-late): 지연·완료 요청. 글자는 red-text, 오류 상자 바탕은 red-tint.
- **상태등 회색** (lamp-done): 완료·보류.

### Tertiary
- **일정 종류 색** (cat-work 업무 파랑, cat-personal 개인 주황, cat-leave 휴가 분홍, cat-project 프로젝트 초록, cat-notice 공지 보라): 달력 날짜 아래 점, 범례, 보드의 "구분" 열 점에만 쓴다. 마이페이지 일정도 같은 색을 공유한다. 토요일 숫자는 sky-text, 일요일은 red-text.

### Neutral
- **콘크리트 바탕** (ground): 공통 틀과 관리자 화면 전체 바탕.
- **흰 작업판** (panel): 패널, 목록 화면의 흰 판, 표, 버튼 바탕.
- **옅은 판 / 판 3** (panel-2, panel-3): 행 호버, 진척 막대 트랙, 스켈레톤.
- **잉크** (ink): 본문 글자, 주 버튼, 코드표, 진척 막대 채움, 굵은 머리 괘선, 포커스 테두리.
- **잉크 2 / 흐림 / 옅음** (ink-2, mute, faint): 보조 글자, 표 머리 글자, 바깥 달 날짜.
- **괘선 / 괘선 2** (rule, rule-2): 1px 행 괘선과 패널 테두리 / 버튼 테두리, 빈 상태 점선.
- **안내판 면** (board-bg, board-row, board-rule, board-ink, board-mute): 검정 상단 띠와 "오늘 일정" 보드 전용. 행 호버는 board-row, 괘선은 board-rule.

### Named Rules
**The 지금 여기 Rule.** 앰버는 현재 위치·다음 출발·선택에만 쓴다. 강조나 장식, 범주 구분, KPI 색으로 쓰지 않는다. 한 화면에서 앰버가 가리키는 것은 손에 꼽을 만큼만 있어야 한다.

**The One Board Rule.** 본문 안의 어두운 면은 대시보드의 "오늘 일정" 보드 하나다. 다른 패널, 목록, 관리자 화면은 흰 작업판으로 둔다.

**The Lamps Are Not Categories Rule.** 상태등 색(초록·주황·회색)은 상태에만, 종류 색(파랑·주황·분홍·초록·보라)은 일정 종류에만 쓴다. 둘을 섞어 새 의미를 만들지 않는다.

## Typography

**Display Font:** JetBrains Mono (with ui-monospace, Consolas)
**Body Font:** Pretendard Variable (with Apple SD Gothic Neo, Malgun Gothic)
**Label/Mono Font:** JetBrains Mono, 탭 숫자

**Character:** 한글 본문은 단단한 고딕으로 조용히 읽히고, 시각·코드·숫자는 고정폭으로 열을 맞춰 안내판처럼 정렬된다. 가장 큰 글자는 제목이 아니라 다음 출발 시각이다.

### Hierarchy
- **Display** (800, 3.5rem, 1): "다음 출발" 시각 한 곳에만, 앰버. 좁은 화면에서 2.5rem.
- **Headline** (800, 1.75rem, 1.2): 대시보드 날짜 머리줄. 좁은 화면에서 1.5rem.
- **Title** (800, 1.5rem, 1.3): 목록 화면·커뮤니티·마이페이지 머리말. 다음 출발 일정 제목도 같은 크기.
- **Panel title** (800, 1.125rem): 패널과 보드 머리.
- **Body** (400, 0.875rem, 1.5): 표 셀, 목록, 본문. 보조 설명은 0.8125rem mute.
- **Label** (700, 0.75rem): 표 머리, 요일, 칩.
- **Mono** (700, 0.75~0.8125rem, tabular): PRJ·ISS 코드, 시각, 퍼센트, D-day, 날짜 숫자, 알림 수, KPI 값.

### Named Rules
**The Tabular Clock Rule.** 시각·날짜·코드·퍼센트·건수는 모두 고정폭 탭 숫자로 쓴다. 숫자가 열에서 흔들리면 안내판이 아니다.

**The Biggest Is Next Rule.** 화면에서 가장 큰 글자는 다음 출발 시각 하나다. 큰 숫자 카드나 히어로 지표로 그 자리를 뺏지 않는다.

## Layout

공통 틀은 최대 폭 1440px, 좌우 여백 32px(860px 이하 16px). 본문은 상단 24px, 하단 40px 여백. 간격은 4px 기반 단계(4·8·12·16·20·24·32·40)를 쓰고, 패널 사이 간격은 20px.

대시보드는 왼쪽 가변 열과 오른쪽 400px 열의 두 칸(1240px 이하 360px). 왼쪽은 "오늘 일정" 보드와 내 프로젝트 표, 오른쪽은 달력·내 이슈·공지. 1000px 이하에서 한 칸으로 접히고 오른쪽 열은 두 칸 격자, 720px 이하에서 한 줄로 쌓인다. 좁은 화면에서는 보드의 "구분" 열과 프로젝트 표 넷째 열을 숨긴다.

목록 화면(프로젝트·이슈·공지·커뮤니티)은 회색 바탕 위 흰 판 하나(안쪽 24px 32px)로 놓인다. 맨 위 머리말 아래 3px 잉크 괘선, 그 아래 1px 괘선 한 줄로 나뉜 검색 줄, 밑줄 탭, 표 순서. 상단 메뉴는 860px 이하에서 두 줄로 나뉘고 메뉴 줄은 가로 스크롤.

밀도는 업무 도구 기준이다. 표 행은 48~56px, 목록 행은 40px 이상, 버튼은 32px.

## Elevation & Depth

이 시스템은 평평하다. 그림자 없이 면의 밝기 차이(회색 바탕 → 흰 판 → 검정 보드)와 괘선으로 층을 만든다. 겹쳐 뜨는 요소는 계정 드롭다운 하나뿐이며, 잉크 1px 테두리로 구분된다.

### Named Rules
**The Flat Sheet Rule.** 판은 바닥에 붙어 있다. 깊이는 그림자가 아니라 바탕 밝기와 괘선 굵기(1px 행, 2px 표 머리, 3px 페이지 머리)로 말한다.

## Shapes

박스·표·버튼 등 모든 모서리는 10px로 둥글린다(밑줄 탭만 선이 곧아야 해서 직각). 버튼, 칩, 코드표, 알림 수, 로고 표시, 달력의 오늘·선택 표시, 상태등까지 네모다. 둥근 형태는 달력·범례의 일정 종류 점(7~8px 원)과 마이페이지 일정 고리뿐이다. 이것은 달력 표시 방식을 유지하기로 한 결정이다.

선은 세 굵기로 위계를 만든다: 행과 패널 테두리 1px, 표 머리와 요일 줄 2px 잉크, 페이지 머리말 3px 잉크. 탭과 메뉴의 현재 표시는 아래 4px 막대(inset)다.

## Components

### Buttons
단단하고 조용한 네모 버튼.
- **Shape:** 10px, 높이 32px, 좌우 12px.
- **Default:** 흰 바탕, 잉크 글자, rule-2 1px 테두리, 0.8125rem 600.
- **Primary:** 잉크 바탕, 흰 글자. 호버 시 순검정.
- **Hover / Focus:** 테두리가 잉크로 바뀐다(160ms). 포커스는 잉크 2px 외곽선, 2px 띄움. 보드와 상단 띠 위에서는 앰버 외곽선.
- **Disabled:** 불투명도 0.45.
- **보드 위 버튼:** 투명 바탕, board-mute 테두리, 흰 글자.

### Chips
- **Style:** 둥근 모서리(4px/2px), 높이 22px, 0.75rem 700. 종류 색 옅은 면 + 짙은 글자.
- **State:** 목록 화면의 상태 칩은 바탕을 빼고 상태등 모양(네모 불 + 글자)으로 바뀐다.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** 흰 작업판, 회색 바탕 위.
- **Shadow Strategy:** 없음 (Elevation & Depth 참고).
- **Border:** rule 1px.
- **Internal Padding:** 20px 24px, 좁은 화면 16px. 패널 머리는 1.125rem 800 제목 + 0.8125rem 보조 설명 + 오른쪽 "더보기" 링크(꺾쇠는 CSS 테두리로 그림).

### Inputs / Fields
- **Style:** 흰 바탕, 1px 괘선 테두리, 직각. 검색 영역은 회색 상자 없이 아래 괘선 한 줄로 끝난다.
- **Focus:** 잉크 2px 외곽선.

### Navigation
- **상단 띠:** 검정(board-bg) 60px. 왼쪽 앰버 네모 로고 표시 + 흰 워드마크, 메뉴는 board-mute 0.9375rem 600, 호버 시 흰 글자 + board-rule 4px 밑줄, 현재 메뉴는 흰 글자 + 앰버 4px 밑줄. 오른쪽 날짜(고정폭), 알림(앰버 네모 숫자), 이름 드롭다운.
- **관리자:** 같은 검정 띠, 앰버 관리자 태그, 앰버 현재 밑줄.
- **페이지 안 탭:** 같은 밑줄 문법을 흰 판 위에서 쓴다(호버 rule-2, 현재 앰버).

### 오늘 일정 보드 (Signature)
대시보드 왼쪽 위의 검정 보드. 머리줄에 "오늘 일정"과 앰버 고정폭 현재 시각. 그 아래 다음 일정 한 줄이 가장 크다: 앰버 56px 시각, 흰 1.5rem 제목, 오른쪽 상태등. 아래 시각표는 시각·구분·일정·상태 네 열, 행 48px, board-rule 괘선, 호버 시 board-row. 상태는 정시(초록), 곧 시작(앰버, 60분 이내), 출발(회색, 지난 일정은 일정에 취소선), 종일. 빈 상태·오류·로딩도 보드 안에서 같은 글자 체계로 보여준다.

### 프로젝트 코드표와 진척 막대
- **코드표:** 잉크 바탕 흰 고정폭 글자 PRJ-012, 높이 22px, 직각. 프로젝트·이슈 이름 앞의 첫 식별자.
- **진척 막대:** 72×6px 트랙(panel-3) 위 잉크 채움 + 고정폭 퍼센트. 단계 이름(착수·설계·개발·테스트·오픈)은 화면 낭독용 이름에 담는다.
- **마감:** 고정폭 D-day, 임박은 accent-text, 지남은 red-text.

### 상태등
8px 네모 불 + 0.8125rem 700 글자. 진행 초록, 지연·완료 요청 주황, 완료·보류 회색, 예정 잉크 2, 지금 앰버 글자.

### 한 줄 숫자 요약
큰 숫자 카드 대신 위아래 1px 괘선 사이 한 줄에 "네모 불 + 이름 + 고정폭 1.25rem 800 숫자"를 나열한다. 관리자 KPI 줄도 같은 형식이다.

### 달력
요일 줄 아래 2px 잉크 괘선, 날짜 칸 높이 60px, 날짜 숫자는 고정폭 네모(30×28). 오늘은 잉크 2px 네모 테두리, 선택은 잉크로 채운 네모에 앰버 숫자. 날짜 아래 종류별 색 점(7px)과 아래 범례를 유지한다. 날짜를 누르면 그날 일정을 보여준다.

### 빈 상태 / 오류
점선 rule-2 테두리 상자에 굵은 제목과 짧은 설명, 가운데 버튼. 오류는 실선 주황 테두리와 red-tint 바탕.

## Do's and Don'ts

### Do:
- **Do** 회색 바탕(#e9ebee) 위에 흰 작업판을 놓고, 1px 괘선과 4px 둥근 모서리로 나눠라.
- **Do** 앰버(#f2a900)는 현재 메뉴, 다음 출발, 선택, 알림 수에만 써라.
- **Do** 시각·날짜·코드·퍼센트·건수를 JetBrains Mono 탭 숫자로 써라.
- **Do** 프로젝트와 이슈는 PRJ-012, ISS-028 코드표를 첫 식별자로 앞에 둬라.
- **Do** 상태는 8px 네모 상태등 + 글자로 표시하라.
- **Do** 표 머리는 2px 잉크 괘선, 페이지 머리말은 3px 잉크 괘선으로 무게를 줘라.
- **Do** 달력의 종류별 색 점(업무 파랑, 개인 주황, 휴가 분홍, 프로젝트 초록, 공지 보라)과 범례를 유지하라.

### Don't:
- **Don't** 어두운 보드를 "오늘 일정" 밖으로 늘리지 마라. 화면 전체를 어둡게 칠한 관제실 흉내는 이 세계가 거부한 것이다.
- **Don't** 둥근 카드나 연파랑 SaaS 템플릿 모양으로 돌아가지 마라.
- **Don't** 판과 버튼에 그림자를 넣지 마라.
- **Don't** 큰 숫자 카드(히어로 지표)를 만들지 마라. 숫자는 한 줄 요약으로 쓴다.
- **Don't** 제목 위에 작은 머리글(키커)이나 글리프 아이콘을 붙이지 마라.
- **Don't** 앰버를 범주 색이나 장식 강조로 쓰지 마라.
- **Don't** 확인되지 않은 수치나 실적을 화면에 넣지 마라.


## 3차 정리 (사용자 요청)
- 날짜 제목을 빼고 "{이름} {직급}님, 오늘 일정 N건"을 36px 큰 인사말로 둔다(숫자 밑 앰버 밑줄).
- 박스마다 회색 머리줄에 제목과 개수(검정 칸·앰버 숫자)를 둔다. 박스 위 여백은 작게, 아래 여백은 넉넉하게(위 16 · 아래 32~40px).
- 설명 문장은 쓰지 않는다. 데이터와 상태 문구만 둔다. 예외: 마이페이지 달력 위 범례·막대 안내.
- 우선도는 색으로 구분한다: 긴급 빨강(#d6293e, 흰 글자), 높음 주황, 보통 회색, 낮음 옅은 회색 테두리(shared/priority.js).
- 이전 단계 백업: .impeccable/backup-round3, .impeccable/backup-subway.
- 로그인·회원가입: 회색 바탕 위 흰 카드(4px), 위쪽 검정 브랜드 띠(앰버 C 표시 + COMMAND ERP), 제목 아래 3px 잉크 선, 잉크 버튼. 스타일은 frontend/src/pages/woojin/Login.css.
- 탭·필터 묶음은 모든 화면에서 같은 밑줄 탭을 쓴다(굵은 잉크 선 위, 선택한 탭만 앰버 밑줄). 알약·검정 채움 탭은 쓰지 않는다.
- 관리자 목록 위 "전체 N건" 요약 상자는 두지 않는다. 마이페이지 내 정보는 판 하나 안에 소제목 + 입력칸으로 정리하고 안쪽 상자를 따로 만들지 않는다.
- 관리자 요약 카드(대시보드·이슈 관리·인사 업무 관리·통계 분석)는 한 양식: 흰 바탕 · 1px 테두리 · 위쪽 3px 색 띠(회색·초록·파랑·앰버) · 작은 이름 + 큰 숫자 33px · 아래 여백이 더 넓음. 기준은 인사 통계 분석 카드.
- 접이식 행(건의자별 업무량 등)은 모두 높이 52px 한 줄.
- 막대 그래프(업무량·진척·이슈 업무량)는 밋밋한 검정 대신 검정에서 밝은 회색으로 이어지는 그라데이션(--bar-ink)을 쓴다.
