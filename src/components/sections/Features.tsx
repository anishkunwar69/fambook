"use client";
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
        "Easy photo & video storage",
        "Easily accessible",
        "Preserve memories for lifetime",
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
        "Share moments with family",
      ],
      url: "https://res.cloudinary.com/dmq5tx0bd/video/upload/f_auto:video,q_auto/gzuwet0vgeht9usgdsev",
    },
  ];

  return (
    <section ref={ref} className="md:py-20 py-12 bg-white" id="features">
      <Container>
        <div className="text-center md:mb-16 mb-10">
          <h2 className="font-lora text-4xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            <span className="hidden md:inline">Everything Your Family Needs</span>
            <span className="md:hidden">Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Features</span></span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 md:block hidden">
              In One Beautiful Place
            </span>
          </h2>
          <p className="font-poppins lg:text-xl sm:text-lg text-base text-gray-600 max-w-3xl mx-auto">
            Stop juggling multiple apps and platforms. Bring your entire family
            together in one secure, beautiful space designed specifically for
            families.
          </p>
        </div>

        <div className="border- border-red-500 max-[520px]:px-2">
          {features.map((feature, index) => (
            <div key={feature.title}>
              <div
                className={`grid lg:grid-cols-2 gap-12 items-start ${index % 2 === 1 ? "lg:grid-cols-2" : ""}`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="bg-rose-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="font-lora sm:text-3xl text-2xl font-bold text-rose-500 mb-4">
                    {feature.title}
                  </h3>
                  <p className="font-poppins sm:text-lg text-base text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <div className="space-y-3">
                    {feature.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <span className="font-poppins sm:text-lg text-sm text-gray-700 font-medium">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`order-first lg:order-none ${index % 2 === 1 ? "lg:order-1" : ""}`}
                >
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
              </div>

              {/* Subtle separator - only show between features, not after the last one */}
              {index < features.length - 1 && (
                <div className="lg:my-20 my-10">
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
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
