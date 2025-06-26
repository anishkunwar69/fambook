import { AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PremiumUpgradeModal from "@/components/modals/PremiumUpgradeModal";

interface FamilyMemberLimitBannerProps {
  currentCount: number;
  maxCount: number;
  isAdmin: boolean;
}

export function FamilyMemberLimitBanner({
  currentCount,
  maxCount,
  isAdmin,
}: FamilyMemberLimitBannerProps) {
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  // Calculate percentage of limit used
  const percentUsed = (currentCount / maxCount) * 100;
  
  // Determine color based on usage
  let barColor = "bg-green-500";
  let textColor = "text-green-700";
  let bgColor = "bg-green-50";
  let borderColor = "border-green-100";
  
  if (percentUsed >= 80 && percentUsed < 100) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
    bgColor = "bg-amber-50";
    borderColor = "border-amber-100";
  } else if (percentUsed >= 100) {
    barColor = "bg-rose-500";
    textColor = "text-rose-700";
    bgColor = "bg-rose-50";
    borderColor = "border-rose-100";
  }

  return (
    <>
      <div className={`${bgColor} border-b ${borderColor} py-2 px-4`}>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Users className={`h-4 w-4 ${textColor}`} />
            <span className={`text-sm font-medium ${textColor}`}>
              Family Tree Members: {currentCount} / {maxCount}
            </span>
            {currentCount >= maxCount && isAdmin && (
              <AlertTriangle className="h-4 w-4 text-amber-500 ml-1" />
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          
          {currentCount >= maxCount && isAdmin && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => setIsPremiumModalOpen(true)}
              >
                Upgrade to Premium
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        featureContext="members"
      />
    </>
  );
} 