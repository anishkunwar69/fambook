"use client";
import { motion, useInView } from "framer-motion";
import {
  Archive,
  Eye,
  FileX,
  Heart,
  HeartCrack,
  Home,
  ImageOff,
  Shield,
  TreePine,
  Users,
} from "lucide-react";
import { useRef } from "react";
import Container from "../Container";

export default function Comparisons() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const comparisons = [
    {
      problemIcon: <ImageOff className="w-6 h-6 text-red-500" />,
      problem: "Family photos and videos are scattered everywhere",
      solutionIcon: <Home className="w-6 h-6 text-rose-500" />,
      solution: "All your family history, stories, and memories in one safe place"
    },
    {
      problemIcon: <Eye className="w-6 h-6 text-red-500" />,
      problem: "Other social media apps are too public and distracting",
      solutionIcon: <Shield className="w-6 h-6 text-rose-500" />,
      solution: "Family-only space with complete privacy and no ads"
    },
    {
      problemIcon: <Users className="w-6 h-6 text-red-500" />,
      problem: "Don't know how you're related to distant family members",
      solutionIcon: <TreePine className="w-6 h-6 text-rose-500" />,
      solution: "Family tree shows connections and helps relatives find each other"
    },
    {
      problemIcon: <FileX className="w-6 h-6 text-red-500" />,
      problem: "Family history, stories, and memories get lost over generations",
      solutionIcon: <Archive className="w-6 h-6 text-rose-500" />,
      solution: "Store stories, videos, and life moments for future generations to revisit"
    },
  ];

  // Add console log for debugging
  console.log("Comparisons data:", comparisons);

  return (
    <section
      ref={ref}
      className="md:py-20 max-xs:pb-12 max-xs:pt-4 py-12 bg-gradient-to-r from-rose-50 to-amber-50"
      id="comparisons"
    >
      <Container>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center md:mb-16 mb-10">
            <h2 className="font-lora text-4xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              <span className="hidden md:inline">One App for Everything Your</span>
              <span className="xs:inline md:hidden hidden">Why Fambook Is Special</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 md:block hidden">
                Family Actually Cares About
              </span>
              <span className="xs:inline md:hidden hidden text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">For Families</span>
              <span className="xs:hidden text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500"><span className="text-black">Why</span> FamBook?</span>
            </h2>
            <p className="font-poppins lg:text-xl sm:text-lg text-base text-gray-600 max-w-3xl mx-auto">
              See how our family-first approach solves the real problems you
              face with scattered memories, privacy concerns, and lost
              connections.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Table Headers - Only visible on md+ screens */}
            <div className="hidden md:grid md:grid-cols-2 bg-gray-50 border-b border-gray-200">
              <div className="p-6 border-r border-gray-200">
                <h3 className="font-lora text-xl lg:text-2xl font-bold text-red-600 flex items-center gap-3">
                  <HeartCrack className="w-6 h-6 lg:w-8 lg:h-8" />
                  Common Problems
                </h3>
              </div>
              <div className="p-6">
                <h3 className="font-lora text-xl lg:text-2xl font-bold text-rose-600 flex items-center gap-3">
                  <Heart className="w-6 h-6 lg:w-8 lg:h-8" />
                  How Our App Solves It
                </h3>
              </div>
            </div>

            {/* First comparison row - rendered separately */}
            <motion.div
              key="comparison-first"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-2 border-b border-gray-500 hover:bg-gray-50/50 transition-colors duration-300"
            >
              {/* Problem */}
              <div className="p-6 md:border-r border-gray-200">
                {/* Mobile heading - only visible on small screens */}
                <div className="md:hidden mb-4">
                  <h3 className="font-lora text-lg font-bold text-red-600 flex items-center gap-2">
                    <HeartCrack className="w-5 h-5" />
                    Problem
                  </h3>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-red-50 p-2 rounded-lg flex-shrink-0 mt-1">
                    <ImageOff className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="font-poppins text-gray-700 leading-relaxed font-medium max-sm:text-sm">
                    Family photos and videos are scattered everywhere
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div className="p-6">
                {/* Mobile heading - only visible on small screens */}
                <div className="md:hidden mb-4">
                  <h3 className="font-lora text-lg font-bold text-rose-600 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Our Solution
                  </h3>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-rose-50 p-2 rounded-lg flex-shrink-0 mt-1">
                    <Home className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="font-poppins text-gray-700 leading-relaxed font-medium max-sm:text-sm">
                    All your family history, stories, and memories in one safe place
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Remaining comparison rows */}
            {comparisons.slice(1).map((item, index) => (
              <motion.div
                key={`comparison-${index + 1}`}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="grid md:grid-cols-2 border-b border-gray-500 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-300"
              >
                {/* Problem */}
                <div className="p-6 md:border-r border-gray-200">
                  {/* Mobile heading - only visible on small screens */}
                  <div className="md:hidden mb-4">
                    <h3 className="font-lora text-lg font-bold text-red-600 flex items-center gap-2">
                      <HeartCrack className="w-5 h-5" />
                      Problem
                    </h3>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-red-50 p-2 rounded-lg flex-shrink-0 mt-1">
                      {item.problemIcon}
                    </div>
                    <p className="font-poppins text-gray-700 leading-relaxed font-medium max-sm:text-sm">
                      {item.problem}
                    </p>
                  </div>
                </div>

                {/* Solution */}
                <div className="p-6">
                  {/* Mobile heading - only visible on small screens */}
                  <div className="md:hidden mb-4">
                    <h3 className="font-lora text-lg font-bold text-rose-600 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Our Solution
                    </h3>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-rose-50 p-2 rounded-lg flex-shrink-0 mt-1">
                      {item.solutionIcon}
                    </div>
                    <p className="font-poppins text-gray-700 leading-relaxed font-medium max-sm:text-sm">
                      {item.solution !== undefined ? item.solution : "All your family history, stories, and memories in one safe place"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
