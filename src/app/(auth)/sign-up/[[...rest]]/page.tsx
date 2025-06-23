"use client";

import { SignUp } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const Page = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleAgreementChange = (checked: boolean) => {
    setAgreedToTerms(checked);
    if (checked) {
      setShowSignUp(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white flex items-center justify-center px-4">
      {!showSignUp ? (
        <div className="bg-white/80 backdrop-blur-md shadow-xl border border-rose-100/50 rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-rose-500 font-lora text-center mb-6">
            Create your account
          </h2>
          <p className="text-gray-600 mb-6 text-center max-sm:text-sm">
            Before you sign up, please review and agree to our Terms and Conditions and Privacy Policy.
          </p>
          
          <div className="flex items-start space-x-3 mb-6">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={handleAgreementChange}
              className="mt-1 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
            />
            <Label htmlFor="terms" className="sm:text-sm text-xs text-gray-700 font-normal leading-relaxed">
              I agree to the{" "}
              <Link href="/terms-and-conditions" target="_blank" className="text-rose-500 hover:text-rose-600 underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" target="_blank" className="text-rose-500 hover:text-rose-600 underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          
          <button
            onClick={() => agreedToTerms && setShowSignUp(true)}
            disabled={!agreedToTerms}
            className={`w-full py-3 rounded-md text-white font-medium transition-colors ${
              agreedToTerms 
                ? "bg-rose-500 hover:bg-rose-600" 
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Continue to Sign Up
          </button>
        </div>
      ) : (
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto mt-12",
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
      )}
    </div>
  );
};

export default Page;
