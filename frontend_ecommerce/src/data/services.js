/**
 * 화면과 실제 서비스 데이터를 분리한 파일입니다.
 * 원본의 p[0], p[1] 방식 대신 icon, name, price 등의 이름을 사용해
 * 각 데이터가 무엇을 의미하는지 코드를 읽는 사람이 바로 알 수 있게 했습니다.
 * DB/API에 연결하지 않는 데모용 고정 데이터입니다.
 */
export const serviceData = {
  system: {
    eyebrow: "BUSINESS AUTOMATION",
    headline: "복잡한 회사 업무를\n하나의 시스템으로",
    sub: "엑셀과 수작업에서 벗어나, 우리 회사에 꼭 맞는 업무 시스템을 도입하세요.",
    products: [
      {
        icon: "📅",
        name: "예약·접수 시스템",
        description: "예약 일정, 고객 접수, 알림 기능",
        price: "150만원~",
        features: ["예약 캘린더", "접수 현황", "알림 관리"],
      },
      {
        icon: "👥",
        name: "고객·상담 관리",
        description: "고객 정보와 상담 이력 통합 관리",
        price: "200만원~",
        features: ["고객 데이터", "상담 내역", "영업 통계"],
      },
      {
        icon: "📦",
        name: "재고·발주 관리",
        description: "재고 수량과 입출고, 발주 자동화",
        price: "250만원~",
        features: ["재고 현황", "입출고 관리", "발주 알림"],
      },
      {
        icon: "🛒",
        name: "쇼핑몰·주문 관리",
        description: "상품 등록부터 주문·배송 관리",
        price: "300만원~",
        features: ["상품 관리", "주문 처리", "매출 통계"],
      },
      {
        icon: "🛠️",
        name: "기능 추가·유지보수",
        description: "기존 업무 시스템 오류 및 기능 개선",
        price: "30만원~",
        features: ["오류 수정", "기능 개선", "운영 지원"],
      },
    ],
  },
  cloud: {
    eyebrow: "CLOUD & SECURITY",
    headline: "안전하고 효율적인\n클라우드 인프라 구축",
    sub: "서버 구축부터 자동 배포, 보안, 운영까지 기업 환경에 맞게 지원합니다.",
    products: [
      {
        icon: "☁️",
        name: "AWS 클라우드 구축",
        description: "EC2, RDS 기반 서비스 배포 환경",
        price: "100만원~",
        features: ["EC2 설정", "RDS 연결", "서비스 배포"],
      },
      {
        icon: "🖥️",
        name: "서버·인프라 관리",
        description: "서버 상태 및 성능 모니터링",
        price: "월 30만원~",
        features: ["서버 모니터링", "백업 설정", "운영 점검"],
      },
      {
        icon: "🛡️",
        name: "보안·접근 권한 구축",
        description: "계정, 네트워크, 접근 통제 설정",
        price: "150만원~",
        features: ["IAM 권한", "네트워크 보안", "보안 점검"],
      },
      {
        icon: "🔀",
        name: "CI/CD 자동 배포 구축",
        description: "GitHub Actions 기반 배포 자동화",
        price: "120만원~",
        features: ["빌드 자동화", "배포 파이프라인", "롤백 설계"],
      },
      {
        icon: "🗄️",
        name: "DB 클라우드 이전",
        description: "데이터베이스 이전 및 백업 설계",
        price: "200만원~",
        features: ["DB 마이그레이션", "백업", "복구 테스트"],
      },
    ],
  },
};

// 상세 화면에서 보여줄 서비스 진행 단계입니다.
export const serviceSteps = [
  { icon: "💬", name: "상담 신청", description: "서비스 선택 및 초기 문의" },
  { icon: "📋", name: "요구사항 분석", description: "필요 기능과 현황 파악" },
  { icon: "📝", name: "견적·계약", description: "비용 및 일정 최종 확정" },
  { icon: "🧑‍💻", name: "구축·검수", description: "개발 또는 인프라 작업" },
  { icon: "✅", name: "인수·유지보수", description: "고객 확인과 운영 지원" },
];

// 이용 절차 화면의 유형별 단계 목록입니다.
export const processStages = {
  system: [
    { icon: "🛍️", name: "서비스 선택", description: "업무 솔루션 탐색" },
    { icon: "📩", name: "견적 상담", description: "요구사항과 예산 전달" },
    { icon: "🧑‍💻", name: "ERP 프로젝트", description: "계약 후 담당자 배정" },
  ],
  cloud: [
    { icon: "☁️", name: "인프라 선택", description: "클라우드·보안 상품 탐색" },
    { icon: "🔍", name: "환경 진단", description: "서버·DB 구성 및 요구 분석" },
    { icon: "⚙️", name: "ERP 프로젝트", description: "계약 후 구축 일정 관리" },
  ],
};

// ERP 기능 소개 카드는 두 유형에서 공통으로 사용합니다.
export const erpFeatures = [
  { icon: "📑", name: "견적·계약 관리", description: "고객의 요청을 확인하고 견적서를 작성" },
  { icon: "📁", name: "프로젝트 관리", description: "승인된 계약에서 프로젝트 생성" },
  { icon: "👤", name: "담당자 배정", description: "팀원 업무와 프로젝트 일정 배분" },
  { icon: "🐞", name: "이슈 관리", description: "오류·장애·유지보수 요청 접수" },
  { icon: "📈", name: "성과 평가", description: "프로젝트와 이슈 처리 기록 활용" },
  { icon: "📊", name: "고객 진행 현황", description: "고객 마이페이지에 진행 상태 표시" },
];
