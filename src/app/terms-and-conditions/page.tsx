"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Container from "@/components/Container";
import Footer from "@/components/sections/Footer";
import Navbar from "@/components/Navbar";

export default function TermsAndConditionsPage() {
  const router = useRouter();

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
            onClick={() => {
              try {
                // Try to go back first
                window.history.go(-1);
                
                // Set a timeout to check if navigation happened
                setTimeout(() => {
                  // If we're still on the same page, go to homepage
                  if (window.location.pathname.includes('terms-and-conditions')) {
                    window.location.href = '/';
                  }
                }, 100);
              } catch (e) {
                // Fallback to homepage if any error occurs
                window.location.href = '/';
              }
            }}
            className="flex items-center gap-2 mb-6 bg-rose-500 rounded-lg px-2 py-1 text-white"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="font-lora text-4xl sm:text-5xl font-bold mb-4 text-gray-800">
                Terms and <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Conditions</span>
              </h1>
            </div>
            
            <div className="prose prose-gray max-w-none font-poppins">
              <p className="sm:text-lg text-gray-600 text-base">
                Welcome to Fambook — a private, ad-free space designed to preserve your family's memories and legacy.
              </p>
              <p className="text-gray-600">
                By signing up and using our services, you agree to the following Terms and Conditions. Please read them carefully.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing or using Fambook ("we," "our," "the platform"), you agree to be bound by these Terms. 
                If you do not agree, please do not use our service.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">2. Purpose of the Service</h2>
              <p className="text-gray-600">
                Fambook provides a private digital space for families to:
              </p>
              <ul className="text-gray-600 list-disc list-inside">
                <li>Share photos, videos, and memories</li>
                <li>Create private family albums</li>
                <li>Set event reminders</li>
                <li>Build and preserve a digital family tree</li>
                <li>Leave stories for future generations</li>
              </ul>
              <p className="text-gray-600">
                We are not a public social media platform. Access is invite-only, and content is visible only to your family members.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">3. User Responsibilities</h2>
              <p className="text-gray-600">
                You agree to:
              </p>
              <ul className="text-gray-600 list-disc list-inside">
                <li>Provide accurate and complete information</li>
                <li>Use the platform only for private, non-commercial, family-related purposes</li>
                <li>Respect the privacy of other users in your family space</li>
                <li>Avoid uploading harmful, offensive, or copyrighted material without permission</li>
              </ul>
              <p className="text-gray-600">
                You are solely responsible for all content you upload, including verifying you have rights to share it.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">4. Media Storage & Security</h2>
              <p className="text-gray-600">
                All media (photos, videos) are securely stored with the following safeguards:
              </p>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl my-4 border border-rose-100 shadow-sm">
                <ul className="space-y-2">
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm">Files are stored in private folders</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm">Access is restricted using signed URLs</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm">All data transfer occurs over HTTPS</span>
                  </li>
                  <li className="list-disc list-inside">
                    <span className="max-sm:text-sm">Content is never indexed or shared publicly</span>
                  </li>
                </ul>
              </div>
              <p className="text-gray-600">
                We do not view or share your files without your explicit permission. Security is our top priority.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">5. Account Access & Termination</h2>
              <p className="text-gray-600">
                You may delete your account at any time. Upon deletion:
              </p>
              <ul className="text-gray-600 list-disc list-inside">
                <li>All personal data, media, and family tree entries are permanently removed</li>
                <li>This process is irreversible</li>
              </ul>
              <p className="text-gray-600">
                We reserve the right to suspend or terminate accounts that violate our terms, abuse the platform, 
                or compromise the privacy of others.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">6. User Content Ownership</h2>
              <p className="text-gray-600">
                You own the content you upload.
              </p>
              <p className="text-gray-600">
                By uploading content, you grant Fambook a limited license to store and display it only to your 
                invited family members, for the purpose of operating and improving the service.
              </p>
              <p className="text-gray-600">
                We do not claim ownership or reuse your content in any commercial or advertising form.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">7. Limitation of Liability</h2>
              <p className="text-gray-600">
                Fambook is provided "as-is." While we take extensive measures to ensure security and uptime:
              </p>
              <ul className="text-gray-600 list-disc list-inside ">
                <li>We are not liable for accidental data loss, service interruptions, or issues caused by third-party services</li>
                <li>We are not responsible for user-generated content or misuse by other users in your family space</li>
              </ul>
              
              <h2 className="font-lora text-2xl font-semibold mt-5 mb-4 text-rose-500">8. Changes to Terms</h2>
              <p className="text-gray-600">
                We may update these Terms occasionally for legal or operational reasons. If we do, 
                we'll notify you clearly on the platform or via email.
              </p>
              
              <h2 className="font-lora text-2xl font-semibold mt-8 mb-4 text-rose-500">Contact Us</h2>
              <p className="text-gray-600">If you have any questions about these Terms and Conditions, please contact us at:</p>
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