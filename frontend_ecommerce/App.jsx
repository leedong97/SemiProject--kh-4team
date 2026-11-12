import { useEffect, useState } from "react";
import { serviceData } from "./data/services";
import Header from "./components/Header";
import ServiceTabs from "./components/ServiceTabs";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import DetailPage from "./pages/DetailPage";
import QuotePage from "./pages/QuotePage";
import FlowPage from "./pages/FlowPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NicknamePage from "./pages/NicknamePage";
import { getSavedMember, saveSession, saveMember, clearSession } from "./shopAuth";
import "./styles/auth.css";

/**
 * App: 전체 데모의 상태를 한 곳에서 관리하는 부모 컴포넌트입니다.
 *
 * 원본 HTML의 일반 변수 → React useState로 변환
 * type      : 'system' 또는 'cloud' (현재 서비스몰)
 * page      : 'home', 'detail', 'quote', 'flow' (현재 화면)
 * selected  : 선택한 상품의 배열 번호
 * submitted : 데모 견적 신청 완료 여부
 *
 * 각 자식 컴포넌트에는 props로 필요한 값과 함수를 전달합니다.
 */
export default function App() {
  const [type, setType] = useState("system");
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  // 로그인한 회원 (새로고침해도 localStorage 에서 복원). 없으면 null
  const [member, setMember] = useState(() => getSavedMember());

  // 선택된 서비스 유형에 해당하는 상품 데이터입니다.
  const category = serviceData[type];
  const selectedProduct = category.products[selected];

  useEffect(() => {
    // 새로고침 또는 브라우저 뒤로 가기 시 URL의 # 부분과 화면을 동기화합니다.
    // 예) #home, #detail-2, #quote, #flow
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1);
      const detailMatch = /^detail-(\d+)$/.exec(hash);

      if (detailMatch) {
        setPage("detail");
        setSelected(Number(detailMatch[1]));
      } else if (["home", "quote", "flow", "login", "signup", "nickname"].includes(hash)) {
        setPage(hash);
      } else {
        setPage("home");
      }
      setSubmitted(false);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navigate = (nextPage, productIndex) => {
    // 상세 버튼을 누른 경우에만 상품 번호를 교체합니다.
    if (productIndex !== undefined) setSelected(productIndex);

    setPage(nextPage);
    setSubmitted(false);

    // React가 화면을 관리하므로 innerHTML을 직접 바꾸지 않습니다.
    const hash = nextPage === "detail" ? `detail-${productIndex ?? selected}` : nextPage;
    if (window.location.hash !== `#${hash}`) {
      window.location.hash = hash;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 로그인/구글 로그인 성공 처리: 닉네임이 없으면 닉네임 설정 화면으로
  const handleLoggedIn = (data) => {
    saveSession(data.shopToken, data.member);
    setMember(data.member);
    navigate(data.needsNickname ? "nickname" : "home");
  };

  const handleNicknameSaved = (updatedMember) => {
    saveMember(updatedMember);
    setMember(updatedMember);
    navigate("home");
  };

  const handleLogout = () => {
    clearSession();
    setMember(null);
    navigate("home");
  };

  const changeType = (nextType) => {
    // 유형을 변경하면 첫 상품을 기본값으로 하고 홈으로 돌아갑니다.
    setType(nextType);
    setSelected(0);
    navigate("home");
  };

  const submitQuote = (event) => {
    event.preventDefault(); // 브라우저의 기본 폼 제출 / 새로고침 막기
    // 시연용이므로 서버로 전송하지 않고 화면의 상태만 변경합니다.
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 공통 레이아웃: 페이지가 바뀌어도 헤더, 탭, 푸터는 그대로 표시됩니다. */}
      <Header onNavigate={navigate} member={member} onLogout={handleLogout} />
      <ServiceTabs type={type} onTypeChange={changeType} />

      <main className="page" id="app">
        {/* 조건부 렌더링으로 현재 화면에 맞는 페이지 컴포넌트만 보여줍니다. */}
        {page === "home" && (
          <HomePage category={category} onNavigate={navigate} />
        )}
        {page === "detail" && (
          <DetailPage type={type} product={selectedProduct} onNavigate={navigate} />
        )}
        {page === "quote" && (
          <QuotePage
            products={category.products}
            selectedIndex={selected}
            submitted={submitted}
            onSubmit={submitQuote}
            onNavigate={navigate}
          />
        )}
        {page === "flow" && <FlowPage type={type} />}
        {page === "login" && <LoginPage onLoggedIn={handleLoggedIn} onNavigate={navigate} />}
        {page === "signup" && <SignupPage onSignedUp={() => navigate("login")} onNavigate={navigate} />}
        {page === "nickname" && (member
          ? <NicknamePage member={member} onSaved={handleNicknameSaved} onNavigate={navigate} />
          : <LoginPage onLoggedIn={handleLoggedIn} onNavigate={navigate} />)}
      </main>

      <Footer />
    </>
  );
}
