"use client";
import { useUser } from "@clerk/nextjs";
import { useInView } from "framer-motion";
import { Calendar, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import Container from "../Container";
import Navbar from "../Navbar";
import { Button } from "../ui/button";

function Hero2() {
  const { user } = useUser();
  return (
    <div className="bg-gradient-to-b from-amber-50 via-rose-50/30 to-white min-h-screen relative overflow-hidden">
      {/* Enhanced Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-1/2 -left-4 w-72 h-72 bg-amber-200 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Demo Video Section */}
      <DemoVideoSection />

      {/* Social Proof */}
      <SocialProofSection />
    </div>
  );
}

function HeroSection() {
  const { user } = useUser();
  return (
    <Container>
      <div className="w-full md:pt-24 pt-[70px] pb-16 flex flex-col items-center gap-8 relative z-10">
        {/* Main Heading */}
        <div className="text-center max-w-5xl mx-auto space-y-8 pt-[50px]">
          <h1 className="font-lora text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-800 leading-tight">
            Your Family's Digital
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 inline-block">
              Legacy Starts Here
            </span>
          </h1>

          <p className="font-poppins text-lg md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create a private, beautiful space where your family's memories,
            stories, and connections live forever. No ads, no strangers — just
            pure family magic. ✨
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:pt-8 pt-[14px]">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-poppins text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-rose-200/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Heart className="w-5 h-5 ml-2" />
              {user ? (
                <Link href="#features">Our Features</Link>
              ) : (
                <Link href="/sign-up">Get Started</Link>
              )}
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-300 hover:border-rose-300 text-gray-700 hover:text-rose-600 font-poppins text-lg px-8 py-6 rounded-xl hover:bg-rose-50 transition-all duration-300 w-full sm:w-auto"
            >
              <Link href="#comparisons">Why Fambook?</Link>
              <Calendar className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

function DemoVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Auto-play video when it comes into view
  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }
  }, [isInView]);

  return (
    <section ref={ref} className="md:pb-[84px] pb-[70px] relative md:pt-[14px]">
      <Container>
        <div className="max-w-5xl mx-auto relative">
          {/* Floating Testimonial Badge */}
          <div className="absolute -top-8 right-4 z-20 hidden lg:block">
            <div className="bg-rose-500 text-white rounded-full px-6 py-3 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-300">See How Fambook</p>
                <p className="font-semibold text-white">
                  Can Be A Home For You <span className="text-lg">🏡</span>
                </p>
              </div>
            </div>
          </div>

          {/* Demo Video Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-rose-500 p-2">
            {/* Auto-playing Video */}
            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/jp6SddpJeTE"
                title="Fambook Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="sm:py-[65px] py-[40px] bg-gradient-to-b from-white to-gray-100/50 border-t border-gray-100"
    >
      <Container>
        <div className="text-center">
          {/* Enhanced Section Header */}
          <div>
            <h3 className="font-lora sm:text-4xl text-2xl text-rose-500 font-semibold sm:mb-3 mb-2">
              Trusted By Families Worldwide
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full mx-auto"></div>
          </div>

          {/* Testimonials Section */}
          <div className="sm:mt-[50px] mt-[30px] mb-7">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <div className="bg-white rounded-2xl sm:p-8 p-4 shadow-lg border border-gray-100 relative hover:shadow-xl transition-all duration-300 group">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-8 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                      </svg>
                    </div>
                  </div>

                  {/* Decorative Gradient Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-t-2xl"></div>

                  <blockquote className="font-poppins text-gray-700 sm:text-lg text-base leading-relaxed sm:mb-8 mb-4 mt-4 italic">
                    "Our family is scattered across four countries, but this app
                    makes us feel like we're back in the same living room
                    again."
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src="https://pbs.twimg.com/profile_images/1925929668139438080/0zGsknPC_400x400.jpg"
                        alt="Prakrit Ojha"
                        className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-lora font-semibold text-gray-800 text-lg">
                        Prakrit Jha
                      </p>
                      <p className="font-poppins text-sm text-gray-500 flex items-center gap-1">
                        Kathmandu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="bg-white rounded-2xl sm:p-8 p-4 shadow-lg border border-gray-100 relative hover:shadow-xl transition-all duration-300 group">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-8 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                      </svg>
                    </div>
                  </div>

                  {/* Decorative Gradient Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl"></div>

                  <blockquote className="font-poppins text-gray-700 sm:text-lg text-base leading-relaxed sm:mb-8 mb-4 mt-4 italic">
                    "We built our family tree and discovered relatives we never
                    knew we had. My kids now know where they come from."
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src="https://scontent.fktm20-1.fna.fbcdn.net/v/t1.6435-9/202588405_10159358515153252_4826645853232762266_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=CRQYnkKn8o4Q7kNvwH5rciJ&_nc_oc=AdnH3dn8fy_XQ3JcPDjNO4Gwksb1v2gZ6VFBnfyfbdnIOnC3DXr8NKiT45-_vSQAqLQ&_nc_zt=23&_nc_ht=scontent.fktm20-1.fna&_nc_gid=QAX3nppcFUwkNUQtIR-NCw&oh=00_AfMNhMSKmIMDnpjiXgxkAOH3gkA3HkoxB3UH16UpXjjfPw&oe=6871D482"
                        alt="Ramesh P."
                        className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full border-2 border-white flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-lora font-semibold text-gray-800 text-lg">
                        Kamal Kunwar
                      </p>
                      <p className="font-poppins text-sm text-gray-500 flex items-center gap-1">
                        Sydney
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="bg-white rounded-2xl sm:p-8 p-4 shadow-lg border border-gray-100 relative hover:shadow-xl transition-all duration-300 group">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-8 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                      </svg>
                    </div>
                  </div>

                  {/* Decorative Gradient Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl"></div>

                  <blockquote className="font-poppins text-gray-700 sm:text-lg text-base leading-relaxed sm:mb-8 mb-4 mt-4 italic">
                    "This feels so much more private than Facebook. I can safely
                    share old wedding photos with my family, without worrying."
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src="https://scontent.fktm20-1.fna.fbcdn.net/v/t1.6435-9/49439022_1589377927831461_4852754977904394240_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=u1ulZv8BO_4Q7kNvwGjmdLv&_nc_oc=AdkoovlfaF1pCNsg6SmN-DhcmS8oNp9vlsYpeXnWp281uRTvG5u0LkXoj_E1wxHnM6A&_nc_zt=23&_nc_ht=scontent.fktm20-1.fna&_nc_gid=GKkosLNMZEsS1c4xy5-uUg&oh=00_AfI2TZ0ndxJUoYNwVu1VBBhWGt9RNwVhZnWju8kuKtfLJA&oe=68638CB8"
                        alt="Rachana Satyal"
                        className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-lora font-semibold text-gray-800 text-lg">
                        Rachana Satyal
                      </p>
                      <p className="font-poppins text-sm text-gray-500 flex items-center gap-1">
                        Canada
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial Footer */}
              <div className="text-center sm:mt-16 mt-10 max-sm:-mb-4">
                <div className="inline-flex items-center gap-2 bg-gray-50 rounded-full px-6 py-3 border">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        M
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        R
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        A
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        +
                      </span>
                    </div>
                  </div>
                  <p className="font-poppins text-sm text-gray-600 font-medium">
                    Join 1,200+ families
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero2;
