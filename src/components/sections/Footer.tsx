import { Mail } from "lucide-react";
import Link from "next/link";
import Container from "../Container";

export default function Footer() {
  return (
    <section className="py-8 md:py-[55px] bg-gradient-to-r from-rose-500 to-amber-500">
      <Container>
        <div className="text-center text-white">
          <h2 className="font-lora text-2xl md:text-4xl lg:text-5xl font-bold mb-6">
            Start Your Family's Digital Legacy Today
          </h2>
          <p className="font-poppins md:text-xl text-sm mb-8 opacity-90 max-w-3xl mx-auto">
            Join thousands of families who've found their perfect private space
            to connect, share, and preserve their most precious memories.
          </p>

          {/* MVP Notice */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="font-lora text-2xl font-bold mb-4">
              🚀 We're in Beta - Your Feedback Matters!
            </h3>
            <p className="font-poppins md:text-lg text-sm mb-4 opacity-90">
              <span className="font-bold">FamBook</span> is currently in MVP
              stage. We're constantly improving and would love to hear your
              thoughts, suggestions, and feedback to make this the perfect
              family platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="mailto:anishkunwar808@gmail.com"
                className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all hover:scale-105 w-full"
              >
                <Mail className="w-4 h-4" />
                <span className="font-poppins max-sm:text-sm">
                  anishkunwar808@gmail.com
                </span>
              </a>
              <a
                href="https://www.instagram.com/anishkunwar_21/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all hover:scale-105 w-full"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="max-sm:w-4 max-sm:h-4"
                >
                  <path
                    d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm4.25 2.25a6.25 6.25 0 1 1 0 12.5a6.25 6.25 0 0 1 0-12.5Zm0 1.5a4.75 4.75 0 1 0 0 9.5a4.75 4.75 0 0 0 0-9.5Zm6.25 1.25a1 1 0 1 1-2 0a1 1 0 0 1 2 0Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="font-poppins max-sm:text-sm">
                  anishkunwar_21
                </span>
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-12 pt-6 border-t border-white/20">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/privacy-policy"
                className="text-white/70 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="text-white/70 hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
