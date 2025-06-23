"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Container from "@/components/Container";
import Footer from "@/components/sections/Footer";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to homepage if there's no history
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-1/2 -left-4 w-72 h-72 bg-amber-200 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Navbar */}
      <Navbar />
      
      <div className="pt-24 pb-10">
        <Container>
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 mb-6 bg-rose-500 rounded-lg px-2 py-1 text-white"
          >
            <ArrowLeft size={18} className="" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="font-lora text-4xl sm:text-5xl font-bold mb-4 text-gray-800">
                Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Policy</span>
              </h1>
                
                </div>
            
            <div className="prose prose-gray max-w-none font-poppins">
              <p className="sm:text-lg text-gray-600 text-base">
                At Fambook, your family's privacy isn't just a feature — it's our foundation. 
                Every photo, video, and story you share stays in your hands, and only within your family. 
                This document explains how we collect, use, and protect your data with care and transparency.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">1. What We Collect</h2>
              <p className="text-gray-600">We collect minimal information to give you the best experience:</p>
              <ul className="text-gray-600 list-disc list-inside">
                <li><strong>Account Info:</strong> Name, email address, profile image</li>
                <li><strong>Media:</strong> Photos, videos, albums you upload</li>
                <li><strong>Family Tree Data:</strong> Names, relationships, and historical notes you voluntarily share</li>
                <li><strong>Events:</strong> Family reminders, dates, milestones</li>
                <li><strong>Device Data:</strong> Browser, device type, IP address (used for analytics and security)</li>
              </ul>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">2. How We Use It</h2>
              <p className="text-gray-600">We use your information only for delivering the core features of Fambook:</p>
              <ul className="text-gray-600 list-disc list-inside">
                <li>To build and manage your private family space</li>
                <li>To enable private media sharing and family tree visualization</li>
                <li>To notify family members about upcoming events</li>
                <li>To protect and secure your account</li>
                <li>Never for advertising, reselling, or sharing with third parties</li>
              </ul>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">3. How We Secure Your Data</h2>
              <p className="text-gray-600">
                We store and deliver your media files with the highest attention to safety:
              </p>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl my-4 border border-rose-100 shadow-sm">
                <ul className="space-y-2">
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm"><strong>Signed URLs Only</strong> – All media access is token-based and time-limited</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm"><strong>End-to-End Encryption</strong> – Your files are transmitted securely using HTTPS</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm"><strong>Private Uploads</strong> – Media is stored in restricted-access folders</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm"><strong>Scoped Access</strong> – Only authenticated, authorized users in your family space can view content</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm"><strong>No public indexing</strong> – Your content is invisible to search engines and the public internet</span>
                  </li>
                </ul>
              </div>
              <p className="text-gray-600">
                We do not expose, resell, or use your personal or family content for any third-party 
                analytics or AI training.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">4. Your Rights</h2>
              <p className="text-gray-600">At any time, you have full control of your data:</p>
              <ul className="text-gray-600 list-disc list-inside">
                <li><strong>❌ Delete anything you've uploaded</strong></li>
                <li><strong>🧼 Request full account deletion</strong> — including all media, tree data, and personal info</li>
                <li><strong>✉️ Reach out directly</strong> at anishkunwar808@gmail.com — we respond personally</li>
              </ul>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">5. Who Can Access Your Data</h2>
              <p className="text-gray-600">
                Only you and the family members you invite have access to your private space.
                Fambook staff will never access your data unless explicitly requested for support — and only with your consent.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">6. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this policy to stay compliant with laws and improve user safety. 
                We'll notify you if we make any significant changes.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-8 mb-4 text-rose-500">Contact Us</h2>
              <p className="text-gray-600">If you have any questions about your privacy or want your data removed, reach out to:</p>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl my-4 border border-rose-100 shadow-sm">
                <p><strong>Email:</strong> <a href="mailto:anishkunwar808@gmail.com" className="text-rose-500 hover:text-rose-600">anishkunwar808@gmail.com</a></p>
                <p><strong>Website:</strong> <a href="https://www.fambook.pro" className="text-rose-500 hover:text-rose-600">https://www.fambook.pro</a></p>
              </div>
            </div>
          </div>
        </Container>
      </div>
      
      <Footer />
    </div>
  );
} 