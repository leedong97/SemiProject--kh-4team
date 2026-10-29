import PricingHeader from "./PricingHeader";
import PricingHero from "./PricingHero";
import PricingSection from "./PricingSection";
import Fc from "./Fc";
import FaqSection from "./FaqSection";
import PricingFooter from "./PricingFooter";
import "./P.css";

export default function PricingPage() {
    return (
        <div className="pricing-page">
            <PricingHeader />

            <main>
                <PricingHero />
                <PricingSection />
                <Fc />
                <FaqSection />
            </main>

            <PricingFooter />
        </div>
    );
}