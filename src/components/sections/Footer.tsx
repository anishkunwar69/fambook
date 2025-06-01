"use client";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Heart, Shield, Zap } from "lucide-react";
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
          <p className="font-poppins text-xl mb-12 opacity-90 max-w-3xl mx-auto">
            Join thousands of families who've found their perfect private space
            to connect, share, and preserve their most precious memories.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
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

          <p className="font-poppins text-sm opacity-80">
            Free forever • No credit card required • Set up in 2 minutes
          </p>

          <motion.div
            className="flex items-center justify-center gap-8 mt-12 text-sm opacity-80"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.8 } : {}}
            transition={{ delay: 0.4 }}
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
