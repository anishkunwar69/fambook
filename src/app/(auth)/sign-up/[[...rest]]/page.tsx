"use client";

import { SignUp } from "@clerk/nextjs";

const Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white flex items-center justify-center px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white/80 backdrop-blur-md shadow-xl border border-rose-100/50",
            headerTitle: "text-2xl font-bold text-gray-800 font-lora",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "hover:bg-rose-50",
            formButtonPrimary: "bg-rose-500 hover:bg-rose-600",
            footerActionLink: "text-rose-500 hover:text-rose-600",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        redirectUrl="/welcome"
      />
    </div>
  );
};

export default Page;
