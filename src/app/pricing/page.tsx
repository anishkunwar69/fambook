import Pricing from "@/components/sections/Pricing";
import Footer from "@/components/sections/Footer";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Pricing - Fambook",
  description: "Preserve your family's legacy with Fambook's affordable pricing plans",
};

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-amber-50 via-rose-50/30 to-white min-h-screen">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-1/2 -left-4 w-72 h-72 bg-amber-200 rounded-full blur-3xl opacity-20" />
      </div>
      
      {/* Navbar */}
      <Navbar />
      
      {/* Pricing Section */}
      <div className="min-h-screen w-full pt-16">
      <Pricing />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 