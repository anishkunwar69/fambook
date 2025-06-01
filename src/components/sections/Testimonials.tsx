"use client";
import { motion, useInView } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useRef } from "react";
import Container from "../Container";

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const testimonials = [
    {
      quote:
        "Finally, a place where our family can share memories without worrying about privacy. Our kids love seeing old photos of their grandparents!",
      author: "Sarah Chen",
      role: "Mother of 3",
      family: "The Chen Family",
      rating: 5,
    },
    {
      quote:
        "The family tree helped us connect with cousins we hadn't spoken to in years. It's amazing how much history we've preserved together.",
      author: "Michael Rodriguez",
      role: "Family Historian",
      family: "The Rodriguez Family",
      rating: 5,
    },
    {
      quote:
        "No more missed birthdays! The reminders keep our whole extended family connected, even when we're scattered across the country.",
      author: "Emma Thompson",
      role: "Busy Professional",
      family: "The Thompson Family",
      rating: 5,
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
          <h2 className="font-lora text-4xl md:text-5xl font-bold text-gray-800 mb-6 text-capitalize">
            See Why Families Choose Us
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 text-capitalize">
              To Preserve Memories{" "}
            </span>
          </h2>
          <p className="font-poppins text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of families who've found their perfect space to
            connect, share memories, and preserve their legacy for generations
            to come.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative"
            >
              {/* Gradient background container */}
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8 h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                  {/* Quote icon with gradient background */}
                  <div className="bg-gradient-to-r from-rose-100 to-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                    <Quote className="w-6 h-6 text-rose-500" />
                  </div>

                  {/* Star rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote text */}
                  <p className="font-poppins text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>

                  {/* Author info */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="font-lora font-bold text-gray-800 text-lg">
                      {testimonial.author}
                    </p>
                    <p className="font-poppins text-sm text-gray-500 mb-1">
                      {testimonial.role}
                    </p>
                    <p className="font-poppins text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                      {testimonial.family}
                    </p>
                  </div>

                  {/* Decorative gradient line */}
                  <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-rose-200 via-rose-300 to-amber-200 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional testimonials stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-lora font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 mb-2">
                10,000+
              </div>
              <p className="font-poppins text-gray-600">Happy Families</p>
            </div>
            <div>
              <div className="text-3xl font-lora font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 mb-2">
                1M+
              </div>
              <p className="font-poppins text-gray-600">Memories Preserved</p>
            </div>
            <div>
              <div className="text-3xl font-lora font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 mb-2">
                99%
              </div>
              <p className="font-poppins text-gray-600">Privacy Protected</p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
