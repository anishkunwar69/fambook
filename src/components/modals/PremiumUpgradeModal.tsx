"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Crown, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureContext?: "families" | "albums" | "storage" | "members" | "posts" | "general";
  showCloseButton?: boolean;
  customActionLabel?: string;
}

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  featureContext = "general",
  showCloseButton = true,
  customActionLabel,
}: PremiumUpgradeModalProps) {
  // Define context-specific content
  const contextContent = {
    families: {
      title: "Unlock Unlimited Family Spaces",
      description: "Your free plan includes one family space. Upgrade to Premium to create unlimited families and unlock all premium features.",
      primaryFeature: {
        title: "Unlimited Family Spaces ♾️ ❤️",
        description: "Connect with all your extended families, in-laws, and friend groups",
      },
    },
    albums: {
      title: "Unlock Unlimited Photo Albums",
      description: "Your free plan includes limited album storage. Upgrade to Premium for unlimited albums and advanced photo features.",
      primaryFeature: {
        title: "Unlimited Photo Albums ♾️📔",
        description: "Create as many albums as you need to organize all your precious memories",
      },
    },
    storage: {
      title: "Unlock Unlimited Storage",
      description: "Your free plan includes limited storage space. Upgrade to Premium for unlimited photo and video storage.",
      primaryFeature: {
        title: "Unlimited Storage Space ♾️📸",
        description: "Never worry about running out of space for your family's precious memories",
      },
    },
    members: {
      title: "Grow Your Family Without Limits",
      description: "Your free plan allows only 20 members per family. Upgrade to Premium for unlimited members and keep your entire family connected.",
      primaryFeature: {
        title: "Unlimited Family Members ♾️ 👨‍👩‍👧‍👦",
        description: "Include everyone in your family space - grandparents, cousins, in-laws, and more",
      },
    },
    posts: {
      title: "Unlock Unlimited Posts",
      description: "Your free plan includes limited post storage. Upgrade to Premium for unlimited posts and advanced post features.",
      primaryFeature: {
        title: "Unlimited Posts ♾️📝",
        description: "Create as many posts as you need to share your family's precious memories",
      },
    },
    general: {
      title: "Unlock Premium Features",
      description: "Upgrade to Premium to unlock all premium features and enhance your family connection experience.",
      primaryFeature: {
        title: "All Premium Features ♾️💖",
        description: "Get access to unlimited families, albums, storage, and premium features",
      },
    },
  };

  const content = contextContent[featureContext];

  return (
    <Dialog open={isOpen} onOpenChange={showCloseButton ? onClose : undefined}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-white border-rose-100/50">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-3 rounded-full mb-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-lora text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-transparent bg-clip-text">
                {content.title}
              </h2>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 py-1 max-sm:text-xs">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="sm:space-y-4 ">
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl p-5 border border-rose-100">
            <h3 className="font-lora text-lg capitalize font-semibold text-red-500 mb-3">
              With Premium, you'll enjoy:
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-full p-1 sm:mt-[6px] mt-1">
                  <Check className="sm:w-4 sm:h-4 w-3 h-3 text-rose-500" />
                </div>
                <p className="text-gray-700 sm:text-base text-sm">
                  <span className="font-medium">{content.primaryFeature.title}</span> — {content.primaryFeature.description}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-full p-1 sm:mt-[6px] mt-1">
                  <Check className="sm:w-4 sm:h-4 w-3 h-3 text-rose-500" />
                </div>
                <p className="text-gray-700 sm:text-base text-sm">
                  <span className="font-medium">Unlimited Photo Storage ♾️ 📸</span> — Preserve every precious memory without limits
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-full p-1 sm:mt-[6px] mt-1">
                  <Check className="sm:w-4 sm:h-4 w-3 h-3 text-rose-500" />
                </div>
                <p className="text-gray-700 sm:text-base text-sm">
                  <span className="font-medium">Advanced Family Tree 🌳 👪</span> — Build a richer legacy with detailed family connections
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-white rounded-full p-1 sm:mt-[6px] mt-1">
                  <Sparkles className="sm:w-4 sm:h-4 w-3 h-3 text-amber-500" />
                </div>
                <p className="text-gray-700 sm:text-base text-sm">
                  <span className="font-medium">Early Access to New Features 🚀 🔥</span> — Be the first to try new ways to connect
                </p>
              </div>
            </div>
          </div>
          
          
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:mt-4 mt-2 sm:py-4 py-2">
          {(customActionLabel || showCloseButton) && (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              {customActionLabel || "Maybe Later"}
            </Button>
          )}
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600">
              <Crown className="w-4 h-4 mr-2 text-amber-200" />
              Upgrade to Premium
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 