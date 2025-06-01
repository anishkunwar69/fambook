
import Hero2 from "@/components/sections/Hero2"
import Features from "@/components/sections/Features"
import Comparisons from "@/components/sections/Comparisons"
import Testimonials from "@/components/sections/Testimonials"
import Footer from "@/components/sections/Footer"

export default async function HomePage() {
  return (
    <>
    <section>
      <Hero2/>
      <Features/>
      <Comparisons/>
      <Testimonials/>
      <Footer/>
    </section>
    </>
  )
}
