import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import NoticeBanner from "../components/NoticeBanner";

/**
 * 홈 화면
 * category: App에서 선택한 서비스 유형의 데이터
 * onNavigate: App의 화면 이동 함수
 * 각 카드의 인덱스를 상세 페이지에 전달해 어떤 상품인지 구분합니다.
 */
export default function HomePage({ category, onNavigate }) {
  return (
    <>
      <Hero category={category} onNavigate={onNavigate} />

      <section className="shell content" id="services">
        <div className="section-title">
          <div>
            <h2>인기 서비스 패키지</h2>
            <p>기업에 필요한 서비스를 선택해 상세 내용을 확인하세요.</p>
          </div>
          <span className="demo-badge">가상 가격 · 데모</span>
        </div>

        <div className="grid">
          {/* map(): 배열의 개수만큼 ProductCard 컴포넌트를 반복 생성합니다. */}
          {category.products.map((product, index) => (
            <ProductCard
              key={product.name}
              product={product}
              onDetail={() => onNavigate("detail", index)}
            />
          ))}
        </div>

        <NoticeBanner
          title="원하는 서비스가 없으신가요?"
          description="기업 요구사항에 맞춰 기능과 구축 범위를 설계합니다."
          buttonText="맞춤 견적 신청 →"
          onClick={() => onNavigate("quote")}
        />
      </section>
    </>
  );
}
