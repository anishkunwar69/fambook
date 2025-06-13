import { Heart, Link2, Cake, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

export function FamilyTreeInfo() {
  return (
    <div className="fixed lg:bottom-6 lg:right-6 z-50 bottom-[105px] right-2">
      <HoverCard openDelay={0} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-white shadow-lg border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200"
          >
            <Info className="h-5 w-5 text-rose-500" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="end" className="w-80 p-6" sideOffset={16}>
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-lg text-gray-900">Family Tree Tags</h4>
              <p className="text-sm text-gray-500">
                Understanding the symbols in your family tree
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
                  <Link2 className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none text-blue-600">Linked Member</p>
                  <p className="text-sm text-gray-500">
                    This member has an account on FamBook. Visit their profile to see their details and history.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 border border-rose-100">
                  <Cake className="h-4 w-4 text-rose-500" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none text-rose-600">Birthday Today</p>
                  <p className="text-sm text-gray-500">
                    It's this member's birthday today! Do not forget to send them a birthday wish and make them feel special.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-100">
                  <Heart className="h-4 w-4 text-gray-500" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none text-gray-600">Remembering</p>
                  <p className="text-sm text-gray-500">
                    This member has passed away. Their memory lives on in our hearts and family history.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-400 italic">
                Click on any member card to see more details
              </p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
} 