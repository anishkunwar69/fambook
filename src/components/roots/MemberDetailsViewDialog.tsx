import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Cake,
  CalendarDays,
  Edit2,
  ExternalLink,
  Flower2,
  Heart,
  Loader2,
  MapPin,
  Star,
  User2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

type Member = {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  isAlive: boolean;
  dateOfDeath?: string | null;
  birthPlace: string;
  currentPlace: string;
  profileImage?: string | null;
  biography?: string | null;
  linkedMemberId: string | null;
  isCurrentUserNode?: boolean;
};

type MemberDetailsViewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onEdit?: () => void;
  canEdit?: boolean;
  familyId?: string;
};

export function MemberDetailsViewDialog({
  isOpen,
  onClose,
  member,
  onEdit,
  canEdit,
  familyId,
}: MemberDetailsViewDialogProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if today is the person's birthday (same month and day, regardless of year)
  const isBirthday = (() => {
    if (!member.dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(member.dateOfBirth);
    return (
      today.getDate() === birthDate.getDate() &&
      today.getMonth() === birthDate.getMonth()
    );
  })();

  const getAge = (birth: string, death?: string | null) => {
    const birthDate = new Date(birth);
    const endDate = death ? new Date(death) : new Date();
    const age = Math.floor(
      (endDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    return age;
  };

  const currentAge = getAge(member.dateOfBirth);
  const ageAtDeath = member.dateOfDeath
    ? getAge(member.dateOfBirth, member.dateOfDeath)
    : null;

  const handleViewProfile = async () => {
    if (!member.linkedMemberId || !familyId) {
      toast.error("Unable to navigate to profile");
      return;
    }

    try {
      setIsNavigating(true);

      const response = await fetch(
        `/api/families/${familyId}/members/${member.linkedMemberId}/user`
      );

      if (!response.ok) {
        throw new Error("Failed to get user information");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to get user information");
      }

      const userId = result.data.userId;
      console.log("[DEBUG] Navigating to profile for user ID:", userId);

      // Navigate to the correct profile URL
      router.push(`/profile/${userId}`);
    } catch (error) {
      console.error("[DEBUG] Failed to navigate to profile:", error);
      toast.error("Failed to open profile. Please try again.");
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-2xl bg-white",
          !member.isAlive && "bg-gradient-to-b from-gray-50 to-white",
          isBirthday && "bg-gradient-to-br from-rose-50 via-white to-rose-50"
        )}
      >
        <DialogHeader>
          <div className="flex flex-col items-center md:gap-4 md:flex-row md:justify-between w-full md:my-6">
            <DialogTitle
              className={cn(
                "font-lora text-xl md:text-2xl text-center md:text-left",
                member.isAlive ? "text-gray-800" : "text-slate-700"
              )}
            >
              {member.firstName} {member.lastName}'s Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {member.linkedMemberId && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow my-2 mb-3",
                    member.isAlive
                      ? "bg-white/50 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                      : "bg-white/70 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                  )}
                  onClick={handleViewProfile}
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isNavigating ? "Loading..." : "View Profile"}
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-200",
                    member.isAlive
                      ? "bg-white border-gray-200"
                      : "bg-white/70 border-slate-200 hover:bg-slate-50"
                  )}
                  onClick={onEdit}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Birthday Wish Section - Only show for living members */}
        {isBirthday && member.isAlive && (
          <div className="p-6 rounded-xl bg-gradient-to-r from-rose-50 via-white to-rose-50 border border-rose-100 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-200" />
              <Cake className="w-6 h-6 text-rose-500" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-200" />
            </div>
            <h3 className="sm:text-xl text-lg text-center font-semibold text-rose-600 mb-2">
              🎉 Happy Birthday, {member.firstName}! 🎂
            </h3>
            <p className="text-center text-rose-600/80 sm:text-sm text-xs">
              Wishing you a day filled with joy, love, and beautiful moments.
              May this special day bring you happiness and wonderful memories
              with your loved ones.
            </p>
          </div>
        )}

        <div className="relative space-y-6">
          {/* Profile Image and Name Section */}
          <div
            className={cn(
              "flex flex-col items-center -mt-2 md:-mt-6 pt-6 md:pt-8 pb-6 px-4 rounded-xl bg-gradient-to-b relative overflow-hidden",
              member.isAlive
                ? "from-rose-50 to-white"
                : "from-gray-100/80 to-white border border-gray-100"
            )}
          >
            {/* Decorative elements for deceased members */}
            {!member.isAlive && (
              <>
                <div className="absolute top-2 left-2 opacity-20">
                  <Flower2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="absolute top-2 right-2 opacity-20">
                  <Flower2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-10">
                  <Star className="w-6 h-6 text-slate-400" />
                </div>
              </>
            )}

            <div
              className={cn(
                "w-24 h-24 rounded-full border-4 mb-4 overflow-hidden relative",
                member.isAlive ? "border-rose-200" : "border-gray-200"
              )}
            >
              {member.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={`${member.firstName} ${member.lastName}`}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    !member.isAlive &&
                      "filter sepia-[0.2] contrast-[0.9] brightness-[0.95]"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "w-full h-full flex items-center justify-center",
                    member.isAlive
                      ? "bg-rose-50"
                      : "bg-gradient-to-br from-slate-100 to-blue-50"
                  )}
                >
                  <User2
                    className={cn(
                      "w-12 h-12",
                      member.isAlive ? "text-rose-300" : "text-slate-400"
                    )}
                  />
                </div>
              )}
              {/* Memorial overlay for deceased members */}
              {!member.isAlive && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
              )}
            </div>

            <h2
              className={cn(
                "text-xl sm:text-2xl font-semibold text-center mb-1 font-serif",
                member.isAlive ? "text-gray-800" : "text-slate-700"
              )}
            >
              {member.firstName} {member.lastName}
            </h2>

            {!member.isAlive && (
              <div className="flex items-center gap-2 text-slate-500 bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm">
                <Heart className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Remembering</span>
              </div>
            )}
          </div>

          {/* Introduction Section */}
          {member.biography && (
            <div className="md:space-y-2 space-y-1">
              <h3
                className={cn(
                  "sm:text-sm text-xs font-medium",
                  member.isAlive ? "text-gray-500" : "text-slate-600"
                )}
              >
                Introduction
              </h3>
              <div
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200",
                  member.isAlive
                    ? "bg-gray-50/50 border-gray-100"
                    : "bg-gray-50/50 border-gray-100"
                )}
              >
                <p
                  className={cn(
                    "text-sm leading-relaxed font-serif",
                    member.isAlive ? "text-gray-600" : "text-slate-600"
                  )}
                >
                  {member.biography}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Birth Details */}
            <div className="md:space-y-2 space-y-1">
              <h3
                className={cn(
                  "sm:text-sm text-xs font-medium",
                  member.isAlive ? "text-gray-500" : "text-slate-600"
                )}
              >
                Birth Details
              </h3>
              <div
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200",
                  member.isAlive
                    ? "bg-rose-50/50 border-rose-100"
                    : "bg-gray-50/50 border-gray-100"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className={cn(
                        "w-4 h-4",
                        member.isAlive ? "text-rose-500" : "text-gray-500"
                      )}
                    />
                    <p
                      className={cn(
                        "sm:text-sm text-xs",
                        member.isAlive ? "text-gray-600" : "text-slate-600"
                      )}
                    >
                      <span className="font-medium">Date of Birth:</span>{" "}
                      {format(new Date(member.dateOfBirth), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "sm:text-sm text-xs pl-6",
                      member.isAlive ? "text-gray-600" : "text-slate-600"
                    )}
                  >
                    <span className="font-medium">
                      {member.isAlive ? "Age" : "Age at Death"}:
                    </span>{" "}
                    {member.isAlive ? currentAge : ageAtDeath} years
                  </p>
                </div>
              </div>
            </div>

            {/* Places */}
            <div className="md:space-y-2 space-y-1">
              <h3
                className={cn(
                  "sm:text-sm text-xs font-medium",
                  member.isAlive ? "text-gray-500" : "text-slate-600"
                )}
              >
                Places
              </h3>
              <div
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200",
                  member.isAlive
                    ? "bg-rose-50/50 border-rose-100"
                    : "bg-gray-50/50 border-gray-100"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={cn(
                        "w-4 h-4",
                        member.isAlive ? "text-rose-500" : "text-gray-500"
                      )}
                    />
                    <p
                      className={cn(
                        "sm:text-sm text-xs",
                        member.isAlive ? "text-gray-600" : "text-slate-600"
                      )}
                    >
                      <span className="font-medium">Birth Place:</span>{" "}
                      {member.birthPlace}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 opacity-0" />
                    <p
                      className={cn(
                        "sm:text-sm text-xs",
                        member.isAlive ? "text-gray-600" : "text-slate-600"
                      )}
                    >
                      <span className="font-medium">
                        {member.isAlive ? "Current Address" : "Place of Death"}:
                      </span>{" "}
                      {member.currentPlace}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Death Information (if applicable) - Enhanced Memorial Section */}
          {!member.isAlive && member.dateOfDeath && (
            <div className="mt-6 p-4 md:p-8 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/90 via-blue-50/50 to-purple-50/30 shadow-lg backdrop-blur-sm relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4">
                  <Flower2 className="w-8 h-8 text-slate-600" />
                </div>
                <div className="absolute top-4 right-4">
                  <Flower2 className="w-8 h-8 text-slate-600" />
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Star className="w-12 h-12 text-slate-600" />
                </div>
              </div>

              {/* Memorial content */}
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
                  <div className="flex items-center gap-2 bg-white/80 px-3 md:px-4 py-1 md:py-2 rounded-full shadow-sm backdrop-blur-sm">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    <span className="text-xs md:text-sm font-medium text-slate-600">
                      Passed away on
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-300/60 to-transparent" />
                </div>

                <div className="text-center space-y-2 md:space-y-4">
                  <p className="text-base md:text-lg font-serif text-slate-700 font-medium">
                    {format(new Date(member.dateOfDeath), "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm md:text-base text-slate-600">
                    At the age of{" "}
                    <span className="font-medium">{ageAtDeath}</span>
                  </p>

                  <div className="mt-4 md:mt-6 pt-4 border-t border-slate-200/50">
                    <p className="text-base md:text-lg italic font-serif leading-relaxed text-slate-500">
                      "In loving memory of Dear {member.firstName}{" "}
                      {member.lastName}"
                    </p>
                    <div className="mt-3 md:mt-4 flex items-center justify-center gap-2 text-slate-400">
                      <Star className="w-4 h-4 text-rose-500" />
                      <span className="text-xs text-rose-500 font-medium tracking-wider uppercase">
                        ❤️ Forever in our hearts ❤️
                      </span>
                      <Star className="w-4 h-4 text-rose-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
