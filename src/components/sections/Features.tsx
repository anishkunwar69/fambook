"use client";
import { motion, useInView } from "framer-motion";
import {
  Check,
  Home,
  Pause,
  Image as PhotoIcon,
  Play,
  TreePine,
} from "lucide-react";
import { useRef, useState } from "react";
import Container from "../Container";

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [videoPaused, setVideoPaused] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const handleVideoToggle = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setVideoPaused((prev) => ({ ...prev, [index]: false }));
      } else {
        video.pause();
        setVideoPaused((prev) => ({ ...prev, [index]: true }));
      }
    }
  };

  const features = [
    {
      icon: <PhotoIcon className="w-8 h-8 text-rose-500" />,
      title: "Beautiful Family Albums",
      description:
        "Create stunning digital albums for birthdays, weddings, holidays, and everyday moments. Organize by events, people, or themes.",
      benefits: [
        "Unlimited photo & video storage",
        "Smart auto-organization",
        "Beautiful templates",
        "Easy sharing within family",
      ],
      url: "https://res.cloudinary.com/dmq5tx0bd/video/upload/f_auto:video,q_auto/jqbnidstesn7zvqv5l09",
    },
    {
      icon: <TreePine className="w-8 h-8 text-rose-500" />,
      title: "Interactive Family Tree",
      description:
        "Build your family legacy with an interactive tree that connects generations. Add stories, photos, and historical information.",
      benefits: [
        "Connect distant relatives",
        "Preserve family history",
        "Share stories & traditions",
        "Educational for kids",
      ],
      url: "https://res.cloudinary.com/dmq5tx0bd/video/upload/f_auto:video,q_auto/bw1ch73cdcxp8byrqyug",
    },
    {
      icon: <Home className="w-8 h-8 text-rose-500" />,
      title: "Private Family Feed",
      description:
        "Share daily moments, updates, and memories in a safe, ad-free environment designed just for your family.",
      benefits: [
        "No strangers or ads",
        "Real-time family updates",
        "Comment & react together",
        "Video calls integration",
      ],
      url: "https://res.cloudinary.com/dmq5tx0bd/video/upload/f_auto:video,q_auto/gzuwet0vgeht9usgdsev",
    },
  ];

  return (
    <section ref={ref} className="py-20 bg-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Everything Your Family Needs
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
              In One Beautiful Place
            </span>
          </h2>
          <p className="font-poppins text-xl text-gray-600 max-w-3xl mx-auto">
            Stop juggling multiple apps and platforms. Bring your entire family
            together in one secure, beautiful space designed specifically for
            families.
          </p>
        </motion.div>

        <div className="space-y-20">
          {features.map((feature, index) => (
            <div key={feature.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`grid md:grid-cols-2 gap-12 items-start ${index % 2 === 1 ? "md:grid-cols-2" : ""}`}
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <div className="bg-rose-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="font-lora text-3xl font-bold text-gray-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="font-poppins text-lg text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <div className="space-y-3">
                    {feature.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <span className="font-poppins text-gray-700">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${index % 2 === 1 ? "md:order-1" : ""}`}>
                  <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-4">
                    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden relative group">
                      <video
                        ref={(el) => {
                          videoRefs.current[index] = el;
                        }}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster=""
                      >
                        <source src={feature.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      {/* Play/Pause Control */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleVideoToggle(index)}
                          className="bg-black/60 hover:bg-black/80 text-white rounded-full p-4 backdrop-blur-sm transition-all duration-300 hover:scale-110"
                        >
                          {videoPaused[index] ? (
                            <Play className="w-8 h-8 ml-1" />
                          ) : (
                            <Pause className="w-8 h-8" />
                          )}
                        </button>
                      </div>

                      {/* Video Status Indicator */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-poppins backdrop-blur-sm">
                          {videoPaused[index] ? "Paused" : "Playing"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Subtle separator - only show between features, not after the last one */}
              {index < features.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.8 }}
                  className="mt-20 mb-0"
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <div className="bg-white px-6">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-rose-200 via-rose-300 to-amber-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
