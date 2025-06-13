"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Page = () => {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["get-database-sync-status"],
    queryFn: async () => {
      const res = await fetch("/api/users/sync");
      return await res.json();
    },
    refetchInterval: (query) => {
      return query.state.data?.isSynced ? false : 1000;
    },
  });

  useEffect(() => {
    if (data?.isSynced) {
      router.push("/dashboard");
    }
  }, [data, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white flex items-center justify-center px-2">
      <BackgroundPattern className="absolute inset-0 left-1/2 z-0 -translate-x-1/2 opacity-75" />

      <div className="relative z-10 flex flex-col items-center sm:gap-6 gap-4 text-center">
        {/* Custom Loading Spinner */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="relative"
          >
            <Heart className="sm:w-12 w-10 h-10 text-rose-500" />
          </motion.div>
          
        </div>

        <h1 className="font-lora sm:text-3xl text-2xl font-bold text-gray-800">
          Setting things up for you...
        </h1>
        <p className="sm:text-base/7 text-xs text-gray-600 max-w-prose">
          Just a moment while we set things up for you. This will take a few
          seconds.
        </p>
      </div>
    </div>
  );
};

const BackgroundPattern = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="768"
      height="736"
      viewBox="0 0 768 736"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <mask
        id="mask0_5036_374506"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="-32"
        width="768"
        height="768"
      >
        <rect
          width="768"
          height="768"
          transform="translate(0 -32)"
          fill="url(#paint0_radial_5036_374506)"
        />
      </mask>
      <g mask="url(#mask0_5036_374506)">
        <g clipPath="url(#clip0_5036_374506)">
          <g clipPath="url(#clip1_5036_374506)">
            <line x1="0.5" y1="-32" x2="0.5" y2="736" stroke="#FFE4E6" />
            <line x1="48.5" y1="-32" x2="48.5" y2="736" stroke="#FFE4E6" />
            <line x1="96.5" y1="-32" x2="96.5" y2="736" stroke="#FFE4E6" />
            <line x1="144.5" y1="-32" x2="144.5" y2="736" stroke="#FFE4E6" />
            <line x1="192.5" y1="-32" x2="192.5" y2="736" stroke="#FFE4E6" />
            <line x1="240.5" y1="-32" x2="240.5" y2="736" stroke="#FFE4E6" />
            <line x1="288.5" y1="-32" x2="288.5" y2="736" stroke="#FFE4E6" />
            <line x1="336.5" y1="-32" x2="336.5" y2="736" stroke="#FFE4E6" />
            <line x1="384.5" y1="-32" x2="384.5" y2="736" stroke="#FFE4E6" />
            <line x1="432.5" y1="-32" x2="432.5" y2="736" stroke="#FFE4E6" />
            <line x1="480.5" y1="-32" x2="480.5" y2="736" stroke="#FFE4E6" />
            <line x1="528.5" y1="-32" x2="528.5" y2="736" stroke="#FFE4E6" />
            <line x1="576.5" y1="-32" x2="576.5" y2="736" stroke="#FFE4E6" />
            <line x1="624.5" y1="-32" x2="624.5" y2="736" stroke="#FFE4E6" />
            <line x1="672.5" y1="-32" x2="672.5" y2="736" stroke="#FFE4E6" />
            <line x1="720.5" y1="-32" x2="720.5" y2="736" stroke="#FFE4E6" />
          </g>
          <rect x="0.5" y="-31.5" width="767" height="767" stroke="#FFE4E6" />
          <g clipPath="url(#clip2_5036_374506)">
            <line y1="15.5" x2="768" y2="15.5" stroke="#FFE4E6" />
            <line y1="63.5" x2="768" y2="63.5" stroke="#FFE4E6" />
            <line y1="111.5" x2="768" y2="111.5" stroke="#FFE4E6" />
            <line y1="159.5" x2="768" y2="159.5" stroke="#FFE4E6" />
            <line y1="207.5" x2="768" y2="207.5" stroke="#FFE4E6" />
            <line y1="255.5" x2="768" y2="255.5" stroke="#FFE4E6" />
            <line y1="303.5" x2="768" y2="303.5" stroke="#FFE4E6" />
            <line y1="351.5" x2="768" y2="351.5" stroke="#FFE4E6" />
            <line y1="399.5" x2="768" y2="399.5" stroke="#FFE4E6" />
            <line y1="447.5" x2="768" y2="447.5" stroke="#FFE4E6" />
            <line y1="495.5" x2="768" y2="495.5" stroke="#FFE4E6" />
            <line y1="543.5" x2="768" y2="543.5" stroke="#FFE4E6" />
            <line y1="591.5" x2="768" y2="591.5" stroke="#FFE4E6" />
            <line y1="639.5" x2="768" y2="639.5" stroke="#FFE4E6" />
            <line y1="687.5" x2="768" y2="687.5" stroke="#FFE4E6" />
            <line y1="735.5" x2="768" y2="735.5" stroke="#FFE4E6" />
          </g>
          <rect x="0.5" y="-31.5" width="767" height="767" stroke="#FFE4E6" />
        </g>
      </g>
      <defs>
        <radialGradient
          id="paint0_radial_5036_374506"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(384 384) rotate(90) scale(384 384)"
        >
          <stop />
          <stop offset="1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="clip0_5036_374506">
          <rect
            width="768"
            height="768"
            fill="white"
            transform="translate(0 -32)"
          />
        </clipPath>
        <clipPath id="clip1_5036_374506">
          <rect y="-32" width="768" height="768" fill="white" />
        </clipPath>
        <clipPath id="clip2_5036_374506">
          <rect y="-32" width="768" height="768" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Page;
