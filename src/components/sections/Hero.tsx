"use client";
import React from "react";
import Container from "../Container";
import { Button } from "../ui/button";
import {
  Heart,
  Image as PhotoIcon,
  Palmtree,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../Navbar";

function Hero() {
  return (
    <section
      className="bg-gradient-to-b from-amber-50 via-rose-50/30 to-white min-h-screen relative overflow-hidden"
      id="hero"
    >
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

      {/* Enhanced Hero Content */}
      <Container>
        <div className="w-full min-h-screen pt-24 flex flex-col items-center gap-8 relative z-10">
          {/* Enhanced Main Heading */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center max-w-4xl mx-auto space-y-6 pt-16"
          >
            <motion.h1
              className="font-lora text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 leading-tight"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Where Every Family
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 inline-block hover:scale-105 transition-transform cursor-default">
                Memory Lives Forever
              </span>
            </motion.h1>

            {/* Enhanced description with typing animation */}
            <motion.p
              className="font-poppins text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Create your family's own private corner on the internet. Share
              photos, celebrate special days, and stay close to your loved ones
              - as easy as sending a text! 🏡✨
            </motion.p>

            {/* Enhanced CTA buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                className="bg-rose-500 hover:bg-rose-600 font-poppins text-lg px-8 py-6 w-full sm:w-auto shadow-lg hover:shadow-rose-200/50 hover:scale-105 transition-all group relative overflow-hidden"
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = "translateY(0)";
                }}
              >
                <span className="relative z-10">Start Your Family Journey</span>
                <Heart className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-500"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              </Button>
              <Button
                variant="outline"
                className="font-poppins text-lg px-8 py-6 w-full sm:w-auto hover:bg-rose-50 transition-all group"
              >
                See How Simple It Is
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Enhanced Features Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-16"
          >
            {/* Feature cards with staggered animation */}
            {[
              {
                icon: <PhotoIcon className="w-8 h-8 text-rose-500" />,
                title: "Family Albums",
                description:
                  "Create albums for every special moment that your future generations can cherish",
                emoji: "📸",
              },
              {
                icon: <Palmtree className="w-8 h-8 text-rose-500" />,
                title: "Family Tree",
                description:
                  "Watch your family tree grow and help the young ones learn about their roots",
                emoji: "🌳",
              },
              {
                icon: <Bell className="w-8 h-8 text-rose-500" />,
                title: "Special Days",
                description:
                  "Never miss a birthday, anniversary, or any special family moment",
                emoji: "🎉",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.2 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  emoji,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  emoji: string;
}) {
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border shadow-sm hover:shadow-xl transition-all group"
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="bg-rose-50 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
        whileHover={{ rotate: 360 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {icon}
      </motion.div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-lora font-bold text-xl text-gray-800">{title}</h3>
        <motion.span
          className="text-2xl"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {emoji}
        </motion.span>
      </div>
      <p className="font-poppins text-gray-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export default Hero;
