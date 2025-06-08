import Comparisons from "@/components/sections/Comparisons";
import Features from "@/components/sections/Features";
import Footer from "@/components/sections/Footer";
import Hero2 from "@/components/sections/Hero2";

export default async function HomePage() {
  return (
    <>
      <section>
        <Hero2 />
        <Features />
        <Comparisons />
        {/* <Testimonials /> */}
        <Footer />
      </section>
    </>
  );
}
