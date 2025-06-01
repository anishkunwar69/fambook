"use client";
import { motion, useInView } from "framer-motion";
import { Calendar, Heart, Play } from "lucide-react";
import { useRef, useState } from "react";
import Container from "../Container";
import Navbar from "../Navbar";
import { Button } from "../ui/button";

function Hero2() {
  return (
    <div className="bg-gradient-to-b from-amber-50 via-rose-50/30 to-white min-h-screen relative overflow-hidden">
      {/* Enhanced Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-4 -right-4 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 -left-4 w-72 h-72 bg-amber-200 rounded-full blur-3xl opacity-20"
        />
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
  return (
    <Container>
      <div className="w-full pt-24 pb-16 flex flex-col items-center gap-8 relative z-10">
        {/* Main Heading */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-5xl mx-auto space-y-8 pt-[50px]"
        >
          <h1 className="font-lora text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 leading-tight">
            Your Family's Digital
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 inline-block">
              Legacy Starts Here
            </span>
          </h1>

          <p className="font-poppins text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create a private, beautiful space where your family's memories,
            stories, and connections live forever. No ads, no strangers — just
            pure family magic. ✨
          </p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-poppins text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-rose-200/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              Start Free Forever
              <Heart className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-gray-300 hover:border-rose-300 text-gray-700 hover:text-rose-600 font-poppins text-lg px-8 py-6 rounded-xl hover:bg-rose-50 transition-all duration-300 w-full sm:w-auto"
            >
              Schedule Demo
              <Calendar className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Container>
  );
}

function DemoVideoSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="pb-[84px] relative pt-[14px]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto relative"
        >
          {/* Floating Testimonial Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            className="absolute -top-8 right-4 z-20 hidden lg:block"
          >
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
          </motion.div>

          {/* Demo Video Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 p-2"
          >
            {/* Simple Video Player Design */}
            <div className="aspect-video bg-white flex items-center justify-center relative rounded-2xl overflow-hidden">
              {!isVideoPlaying ? (
                <>
                  {/* Subtle Grid Background */}
                  <div className="absolute inset-0 opacity-[0.02]">
                    <div className="grid grid-cols-20 grid-rows-12 h-full w-full">
                      {[...Array(240)].map((_, i) => (
                        <div key={i} className="border border-gray-300"></div>
                      ))}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-2xl">
                      <div className="text-6xl md:text-8xl font-bold text-blue-500 mb-4">
                        TRUST{" "}
                        <span className="text-gray-800 font-normal text-4xl md:text-5xl">
                          is key.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simple Play Button */}
                  <motion.button
                    onClick={() => setIsVideoPlaying(true)}
                    className="absolute bottom-6 left-6 bg-rose-500 hover:bg-rose-600 rounded-full p-4 shadow-lg transition-all duration-300 z-10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </motion.button>

                  {/* Video Controls Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex items-center gap-4 text-white">
                      <button className="hover:text-rose-300 transition-colors">
                        <Play className="w-5 h-5" />
                      </button>
                      <div className="flex-1 bg-white/20 rounded-full h-1">
                        <div className="bg-rose-500 h-1 rounded-full w-1/4"></div>
                      </div>
                      <span className="text-sm font-mono">0:15 / 1:05</span>
                      <div className="flex gap-2">
                        <button className="hover:text-rose-300 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13.5H2a1 1 0 01-1-1V7.5a1 1 0 011-1h2.5l3.883-3.324z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button className="hover:text-rose-300 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Play className="w-8 h-8 text-rose-500" />
                  </motion.div>
                  <p className="font-poppins text-gray-600 text-lg mb-4">
                    Demo video playing...
                  </p>
                  <Button
                    onClick={() => setIsVideoPlaying(false)}
                    variant="outline"
                    className="border-rose-300 text-rose-600 hover:bg-rose-50"
                  >
                    Close Demo
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
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
      className="py-[65px] bg-gradient-to-b from-white to-gray-100/50 border-t border-gray-100"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Enhanced Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-lora text-4xl text-rose-500 font-semibold mb-3">
              Trusted By Families Worldwide
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full mx-auto"></div>
          </motion.div>

          {/* Testimonials Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-[50px] mb-16"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative hover:shadow-xl transition-all duration-300 group"
                >
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

                  <blockquote className="font-poppins text-gray-700 text-lg leading-relaxed mb-8 mt-4 italic">
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
                        Prakrit Ojha
                      </p>
                      <p className="font-poppins text-sm text-gray-500 flex items-center gap-1">
                        Kathmandu
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Testimonial 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.9 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative hover:shadow-xl transition-all duration-300 group"
                >
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

                  <blockquote className="font-poppins text-gray-700 text-lg leading-relaxed mb-8 mt-4 italic">
                    "We built our family tree and discovered relatives we never
                    knew we had. My kids now know where they come from."
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
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
                </motion.div>

                {/* Testimonial 3 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.0 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative hover:shadow-xl transition-all duration-300 group"
                >
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

                  <blockquote className="font-poppins text-gray-700 text-lg leading-relaxed mb-8 mt-4 italic">
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
                </motion.div>
              </div>

              {/* Testimonial Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1 }}
                className="text-center mt-16"
              >
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
                    Join 1,200+ families sharing their stories
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-12 flex-wrap"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-poppins text-sm font-medium">
                100% Private
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-poppins text-sm font-medium">
                End-to-End Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-poppins text-sm font-medium">
                No Ads Ever
              </span>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

export default Hero2;
