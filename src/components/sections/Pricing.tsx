"use client";
import { Check, Crown, Heart, Star, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useRef, useState } from "react";
import Container from "../Container";
import { Button } from "../ui/button";
import { motion, useInView } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// FAQ items with expanded content
const faqItems = [
  {
    question: "If I upgrade to Premium, do all my family members get access too?",
    answer: "Yes, absolutely. All members of your family spaces automatically get Premium features when you upgrade. You pay once, and your entire family benefits — there's no need for each family member to purchase their own plan. Everyone gets unlimited albums, full access to family trees, higher upload limits, and all other Premium features.",
    icon: "✅"
  },
  {
    question: "Is the free plan really free?",
    answer: "Yes — no credit card required, no trial timer. Just real value, always free. We believe in providing genuine value to families who want to start their digital legacy journey without any financial commitment.",
    icon: "💯"
  },
  {
    question: "What happens if I hit the free limits?",
    answer: "Your media stays safe, but you won't be able to post, upload, or add more events unless you upgrade. You'll still have full access to view and download everything you've already added to your family space.",
    icon: "🔒"
  },
  {
    question: "Can I cancel Premium anytime?",
    answer: "Of course — your memories are yours. Cancel anytime with a click. If you cancel, you'll continue to have Premium access until the end of your billing period, and then automatically transition to the Free plan without losing any of your content.",
    icon: "✨"
  },
  {
    question: "Is my family's data private and secure?",
    answer: "Absolutely. Your family's privacy is our top priority. All content is encrypted, only accessible to invited family members, and we never sell your data or show ads. Your memories stay private, just as they should be.",
    icon: "🛡️"
  },
  {
    question: "Can I try Premium before committing?",
    answer: "We don't offer a traditional trial, but our Free plan gives you a great taste of what Fambook offers. If you upgrade and find Premium isn't right for you, we offer a 14-day money-back guarantee — no questions asked.",
    icon: "🎁"
  }
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const toggleBillingCycle = () => {
    setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly");
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePurchase = (plan: string, price: string) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleEmailOpen = () => {
    const subject = `FamBook ${selectedPlan} Plan Request`;
    let body = '';
    
    if (selectedPlan === "Lifetime Premium") {
      body = `Hello FamBook Team,

I'm interested in subscribing to the ${selectedPlan} Plan ($249 one-time payment).

Please add me to the early access list and let me know how I can proceed with the payment.

Thank you!`;
    } else {
      body = `Hello FamBook Team,

I'm interested in subscribing to the ${selectedPlan} Plan${selectedPlan === "Basic" ? " ($9.99/month)" : " ($19.99/month)"}.

Please add me to the early access list and let me know how I can proceed with the payment.

Thank you!`;
    }

    window.location.href = `mailto:anishkunwar808@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsDialogOpen(false);
  };

  return (
    <section
      ref={ref}
      className="md:py-20 py-14 bg-gradient-to-b from-white to-rose-50/30"
      id="pricing"
    >
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-lora text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            Preserve Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
              Family Legacy
            </span>
          </h2>
          <p className="font-poppins text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-[26px]">
            Memories fade. Stories disappear. Unless you preserve them.
            Create a digital legacy that lasts for generations.
          </p>
          
          {/* Premium Family Access Highlight */}
          <p className="font-poppins font-medium text-rose-600 bg-rose-50 rounded-full px-6 py-2 max-w-2xl mx-auto mb-8 border border-rose-100 inline-block">
            ✨ <span className="font-bold">One Premium plan, your entire family benefits</span> — everyone gets full access!
          </p>
          
          {/* Media Limits Info Button */}
          <div className="flex justify-center mb-8">
            <HoverCard openDelay={0} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-blue-50 border-blue-100 hover:border-blue-200 hover:bg-blue-100 transition-all duration-200 flex items-center gap-2"
                >
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 text-sm">Media Limits Explained</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-6" sideOffset={8}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg text-gray-900">Understanding Media Limits</h4>
                    <p className="text-sm text-gray-500">
                      How media counts and size limits work in FamBook
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-blue-600">📅 Monthly Reset</p>
                      <p className="text-sm text-gray-500">
                        All monthly limits (posts, albums, events) reset on the 1st of each month. Your content stays forever, only the creation limits reset.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-blue-600">📊 Media Count vs Size</p>
                      <p className="text-sm text-gray-500">
                        Each plan has two types of limits: how many media files you can upload, and how big those files can be.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-blue-600">🎥 Video Limits</p>
                      <p className="text-sm text-gray-500">
                        Plans limit both the number of videos and their total size. For example, "3 videos up to 500MB total" means you can upload up to 3 videos with a combined size of 500MB.
                      </p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`font-poppins font-medium ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"}`}>
              Monthly
            </span>
            <button
              onClick={toggleBillingCycle}
              className="relative inline-flex h-6 w-12 items-center rounded-full bg-gradient-to-r from-rose-400 to-amber-400"
            >
              <span className="sr-only">Toggle billing cycle</span>
              <span
                className={`${
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300`}
              />
            </button>
            <span className={`font-poppins font-medium flex items-center gap-1 ${billingCycle === "yearly" ? "text-gray-900" : "text-gray-500"}`}>
              Yearly <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Save 25%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid 1118:grid-cols-3 gap-8 max-w-6xl mx-auto -mt-5">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-lora text-2xl font-bold text-gray-800">Free Plan</h3>
                  <p className="text-gray-500 font-poppins max-sm:text-sm">Start your family
                  <span className="hidden 1118:inline"><br/>journey for free</span> <span className="1118:hidden">journey for free</span></p>
                </div>
                <div className="bg-gray-100 p-2 rounded-full">
                  <Star className="w-6 h-6 text-gray-500" />
                </div>
              </div>
              
              <div className="mb-6">
                <span className="font-lora text-4xl font-bold text-gray-800">$0</span>
                <span className="text-gray-500 font-poppins">/month</span>
              </div>
              
              <p className="text-gray-600 mb-6 font-poppins">
                Perfect for small families exploring how Fambook can bring them closer.
              </p>
              
              <div className="my-6">
                <Button
                  className="w-full  cursor-not-allowed bg-gray-800 text-white"
                  size="lg"
                >
                  Current Plan
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">1 Private Family Space</p>
                    <p className="text-sm text-gray-500">Up to 15 members</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">5 Albums per month</p>
                    <p className="text-sm text-gray-500">Up to 15 total media per album</p>
                    <p className="text-sm text-gray-500">Can include up to 1 video per album (100 MB)</p>
                    <p className="text-sm text-gray-500">Image size: 10 MB each</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">30 Feed Posts per Month</p>
                    <p className="text-sm text-gray-500">Total of 5 media per post</p>
                    <p className="text-sm text-gray-500">Can include up to 1 video per post (100 MB)</p>
                    <p className="text-sm text-gray-500">Image size: 10 MB each</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Add up to 3 family events per month</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Build a Family Tree</p>
                    <p className="text-sm text-gray-500">Up to 20 members</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Add up to 20 Life Events per profile</p>
                  </div>
                </div>
                
                
              </div>
            </div>
          </motion.div>
          
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg overflow-hidden border border-amber-200 hover:shadow-xl transition-all duration-300 relative"
          >
            {/* Loved by most families Badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-1 rounded-bl-lg font-medium text-sm shadow-md">
                LOVED BY MOST FAMILIES
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-lora text-2xl font-bold text-amber-500">Basic Plan</h3>
                  <p className="text-gray-600 font-poppins max-sm:text-sm">Perfect balance of features and value</p>
                </div>
                <div className="bg-gradient-to-r from-amber-400 to-yellow-400 p-2 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="mb-6">
                <span className="font-lora text-4xl font-bold text-amber-500">
                  $9.99
                </span>
                <span className="text-gray-500 font-poppins">
                  /month
                </span>
              </div>
              
              <p className="text-gray-600 mb-6 font-poppins">
                Ideal for average-sized families looking to share memories across cities or countries.
              </p>
              
              <div className="my-6">
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  size="lg"
                  onClick={() => handlePurchase("Basic", billingCycle === "yearly" ? "$99.99/year" : "$9.99/month")}
                >
                  Get Started
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Up to 10 Family Spaces</p>
                    <p className="text-sm text-gray-600">Unlimited members per space</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">20 Albums per month <span className="text-amber-600 font-medium">(per family)</span></p>
                    <p className="text-sm text-gray-600">Up to 200 total media</p>
                    <p className="text-sm text-gray-600">Max 20MB per image</p>
                    <p className="text-sm text-gray-600">Each album can include multiple videos totaling up to 1GB in size.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">100 Feed Posts per month <span className="text-amber-600 font-medium">(per family)</span></p>
                    <p className="text-sm text-gray-600">Total of 10 media per post</p>
                    <p className="text-sm text-gray-600">Each post can include up to 3 videos, with a total combined size of 500 MB</p>
                    <p className="text-sm text-gray-600">Image size: 10 MB each</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Add up to 20 events per month <span className="text-amber-600 font-medium">(per family)</span></p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Family Tree</p>
                    <p className="text-sm text-gray-600">Add up to 50 members</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl shadow-lg overflow-hidden border border-rose-200 hover:shadow-xl transition-all duration-300 relative"
          >
            {/* Popular Badge - Removed */}
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-lora text-2xl font-bold text-rose-500">Premium Plan</h3>
                  <p className="text-gray-600 font-poppins max-sm:text-sm">Preserve your family's legacy forever</p>
                </div>
                <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-2 rounded-full">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="mb-6">
                <span className="font-lora text-4xl font-bold text-rose-500">
                  ${billingCycle === "monthly" ? "19.99" : "179"}
                </span>
                <span className="text-gray-500 font-poppins">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>
              
              <p className="text-gray-600 mb-6 font-poppins">
                For families who want more space, more memories, and more meaning.
              </p>
              
              <div className="my-6">
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                  size="lg"
                  onClick={() => handlePurchase("Premium", billingCycle === "yearly" ? "$199.99/year" : "$19.99/month")}
                >
                  Get Started
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Unlimited Family Spaces</p>
                    <p className="text-sm text-gray-600">Up to 100 members per space</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Unlimited Albums <span className="text-rose-600 font-medium">(per family)</span></p>
                    <p className="text-sm text-gray-600">Unlimited photos (20 MB each)</p>
                    <p className="text-sm text-gray-600">Each album can include multiple videos totaling up to 5 GB in size.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Unlimited Feed Posts <span className="text-rose-600 font-medium">(per family)</span></p>
                    <p className="text-sm text-gray-600">Upload multiple videos and images per post</p>
                    <p className="text-sm text-gray-600">Each post can include videos totaling up to 1 GB.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Unlimited Events with reminders <span className="text-rose-600 font-medium">(per family)</span></p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Unlimited Family Tree</p>
                    <p className="text-sm text-gray-600">Add custom relationships, extended generations, and styling</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Unlimited Life Events on each member's profile</p>
                  </div>
                </div>
                
                
                
                
                
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Priority Support</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Launch Deal */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl p-1">
            <div className="bg-white rounded-xl p-8">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Heart className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-lora text-2xl font-bold bg-transparent bg-gradient-to-r from-rose-400 to-amber-500 text-transparent bg-clip-text">Early Family Offer</h3>
                </div>
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  Limited to first 1,000 families
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 font-poppins max-sm:text-sm">
                Get lifetime access to Premium for a one-time payment. Create your family's digital museum that will last for generations. Hurry, this offer is limited to the first 1,000 families.
              </p>
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="font-lora text-3xl font-bold text-rose-500">$249</span>
                  <span className="text-gray-500 font-poppins"> one-time payment</span>
                </div>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-6 px-8 rounded-xl shadow-lg hover:shadow-amber-200/50"
                  onClick={() => handlePurchase("Lifetime Premium", "$249 one-time")}
                >
                  Become a Founding Family
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        {/* add a subtle visual separator */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-50 to-amber-50 mt-14"></div>
        <div className="mt-10">
          <h3 className="text-rose-500 font-lora text-3xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h3>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10 font-poppins">
            Everything you need to know about preserving your family's legacy with Fambook
          </p>
          
          <div className="max-w-5xl mx-auto">
            {faqItems.map((item, index) => (
              <div
                key={`faq-${index}`}
                className="mb-4"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full text-left p-6 rounded-xl flex items-center justify-between transition-all duration-200 ${
                    openFaq === index 
                      ? "bg-gradient-to-r from-rose-50 to-amber-50 shadow-md" 
                      : "bg-white shadow hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      openFaq === index 
                        ? "bg-gradient-to-r from-rose-100 to-amber-100" 
                        : "bg-gray-100"
                    }`}>
                      {item.icon}
                    </div>
                    <h4 className="font-lora text-lg font-bold text-gray-800 capitalize">
                      {item.question}
                    </h4>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className={`w-5 h-5 ${openFaq === index ? "text-rose-500" : "text-gray-400"}`} />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {openFaq === index && (
                  <div
                    className="bg-white px-6 pb-6 pt-4 rounded-b-xl shadow-md -mt-2"
                  >
                    <div className="pl-7 border-l-2 border-rose-200 ml-5">
                      <p className="font-poppins text-gray-600 leading-relaxed mt-[18px]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
          
        {/* Final CTA */}
        <div className="mt-16 text-center">
          <h3 className="font-lora text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            This isn't just a subscription. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
              It's your family's story — preserved forever.
            </span>
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button 
              variant="outline" 
              className="border-2 border-gray-300 hover:border-rose-300 text-gray-700 hover:text-rose-600 font-poppins text-lg px-8 py-6 rounded-xl hover:bg-rose-50 transition-all duration-300 w-full sm:w-auto"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Start For Free
            </Button>
            <Button  
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-poppins text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-rose-200/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              onClick={() => handlePurchase("Premium", billingCycle === "yearly" ? "$179/year" : "$19.99/month")}
            >
              Upgrade to Premium
            </Button>
          </div>
         
        </div>
      </Container>
      
      {/* Early Access Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Not Yet Integrated</DialogTitle>
            <DialogDescription>
              Thank you for your interest in our {selectedPlan} Plan! 
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              We're currently in the process of integrating our payment system. If you'd like to be added to our early access list, please click the button below to send us an email with your plan selection.
            </p>
            <p className="text-sm text-gray-600">
              If your need is urgent, please mention that in your email and we'll prioritize your request.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailOpen} className="bg-rose-500 hover:bg-rose-600 text-white">
              Email Us
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
} 