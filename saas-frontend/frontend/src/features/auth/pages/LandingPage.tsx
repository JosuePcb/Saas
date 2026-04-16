import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import PricingSection from '@/components/landing/PricingSection'
import { CtaSection, Footer } from '@/components/landing/CtaAndFooter'

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-white">
            <Navbar />
            <main>
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection />
                <PricingSection />
                <CtaSection />
            </main>
            <Footer />
        </div>
    )
}