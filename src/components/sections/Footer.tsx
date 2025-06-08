"use client";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Heart, Shield, Zap, Mail, MessageCircle, Github } from "lucide-react";
import { useRef } from "react";
import Container from "../Container";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="py-20 bg-gradient-to-r from-rose-500 to-amber-500"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-white"
        >
          <h2 className="font-lora text-4xl md:text-5xl font-bold mb-6">
            Start Your Family's Digital Legacy Today
          </h2>
          <p className="font-poppins text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            Join thousands of families who've found their perfect private space
            to connect, share, and preserve their most precious memories.
          </p>

          {/* MVP Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-2xl mx-auto"
          >
            <h3 className="font-lora text-2xl font-bold mb-4">
              🚀 We're in Beta - Your Feedback Matters!
            </h3>
            <p className="font-poppins text-lg mb-4 opacity-90">
              FamBook is currently in MVP stage. We're constantly improving and would love to hear your thoughts, suggestions, and feedback to make this the perfect family platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="mailto:feedback@fambook.app"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all hover:scale-105"
              >
                <Mail className="w-4 h-4" />
                <span className="font-poppins">feedback@fambook.app</span>
              </a>
              <a
                href="https://github.com/yourusername/fambook/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all hover:scale-105"
              >
                <Github className="w-4 h-4" />
                <span className="font-poppins">Report Issues</span>
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // You can replace this with your preferred feedback form/survey
                  window.open('mailto:feedback@fambook.app?subject=FamBook Feedback&body=Hi! I would like to share my feedback about FamBook:', '_blank');
                }}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-poppins">Send Feedback</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <Input
              type="email"
              placeholder="Enter your family email..."
              value={""}
              onChange={(e) => {}}
              className="font-poppins text-lg px-6 py-6 w-full bg-white text-gray-800"
            />
            <Button className="bg-white text-rose-500 hover:bg-gray-50 font-poppins text-lg px-8 py-6 w-full sm:w-auto shadow-lg hover:scale-105 transition-all whitespace-nowrap">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <p className="font-poppins text-sm opacity-80 mb-8">
            Free forever • No credit card required • Set up in 2 minutes
          </p>

          <motion.div
            className="flex items-center justify-center gap-8 mt-12 text-sm opacity-80"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.8 } : {}}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>100% Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Family-Only</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Setup in Minutes</span>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
