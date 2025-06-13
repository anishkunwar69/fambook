import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cake, Edit2, Heart, Link } from "lucide-react";
import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { MemberDetailsViewDialog } from "./MemberDetailsViewDialog";

type FamilyMemberNodeProps = {
  data: {
    firstName: string;
    lastName: string;
    profileImage: string | null;
    gender: "MALE" | "FEMALE" | "OTHER";
    isAlive: boolean;
    dateOfBirth: string;
    dateOfDeath: string | null;
    birthPlace: string;
    currentPlace: string;
    biography: string | null;
    linkedMemberId: string | null;
    isCurrentUserNode: boolean;
    familyId: string;
    isAdmin?: boolean;
    onEdit?: () => void;
  };
  selected: boolean;
};

export const FamilyMemberNode = memo(({ data, selected }: FamilyMemberNodeProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  console.log("[DEBUG] Node data:", data);
  console.log("[DEBUG] linkedMemberId:", data.linkedMemberId);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getAgeDisplay = () => {
    if (!data.dateOfBirth) return "";
    const birthDate = new Date(data.dateOfBirth);
    const deathDate = data.dateOfDeath ? new Date(data.dateOfDeath) : null;
    const endDate = deathDate || new Date();
    const age = Math.floor(
      (endDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    return `${age} years`;
  };

  // Check if today is the person's birthday (same month and day, regardless of year)
  const isBirthday = (() => {
    if (!data.dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(data.dateOfBirth);
    return (
      today.getDate() === birthDate.getDate() &&
      today.getMonth() === birthDate.getMonth()
    );
  })();

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open details if the click wasn't on the edit button
    if (!(e.target as HTMLElement).closest('.edit-button')) {
      setIsDetailsOpen(true);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onEdit) {
      data.onEdit();
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-lg shadow-sm border-2 p-4 w-[280px] cursor-pointer transition-all duration-200",
          // Base styles
          "hover:shadow-md",
          // Birthday styles
          isBirthday && "bg-gradient-to-br from-rose-50 via-white to-rose-50",
          // Deceased styles
          !data.isAlive && "bg-gradient-to-br from-gray-50 to-white border-gray-200",
          // Linked member styles
          data.linkedMemberId && "bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-200",
          // Current user node styles
          data.isCurrentUserNode && "bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-emerald-200",
          // Selected styles
          selected ? "border-rose-500" : data.linkedMemberId ? "border-blue-200" : "border-gray-100",
        )}
        onClick={handleCardClick}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={cn(
            "!w-3 !h-3",
            data.linkedMemberId ? "!bg-blue-500" : "!bg-rose-500",
            !data.isAdmin && "!opacity-0 !cursor-default"
          )}
          isConnectable={data.isAdmin}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={cn(
            "!w-3 !h-3",
            data.linkedMemberId ? "!bg-blue-500" : "!bg-rose-500",
            !data.isAdmin && "!opacity-0 !cursor-default"
          )}
          isConnectable={data.isAdmin}
        />
        
        {data.isAdmin && (
          <Button
            size="icon"
            variant="outline"
            className="edit-button absolute top-2 right-2 h-8 w-8 bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleEditClick}
            title="Edit member"
          >
            <Edit2 className="h-4 w-4 text-gray-500" />
          </Button>
        )}
        
        <div className="flex items-center gap-3">
          <Avatar className={cn(
            "w-12 h-12 border-2 shadow-sm",
            data.linkedMemberId ? "border-blue-200" : "border-white",
            data.isCurrentUserNode && "border-emerald-200"
          )}>
            <AvatarImage src={data.profileImage || undefined} />
            <AvatarFallback className={cn(
              data.gender === "MALE" ? "bg-blue-100 text-blue-500" :
              data.gender === "FEMALE" ? "bg-rose-100 text-rose-500" :
              "bg-gray-100 text-gray-500"
            )}>
              {getInitials(data.firstName, data.lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
              {data.firstName} {data.lastName}
            </h3>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500">{getAgeDisplay()}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {!data.isAlive && (
                  <div className="px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-600 font-medium">Remembering</span>
                  </div>
                )}
                {data.linkedMemberId && (
                  <div className="px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 flex items-center gap-1">
                    <Link className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] text-blue-600 font-medium">Linked</span>
                  </div>
                )}
                {isBirthday && (
                  <div className="px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 flex items-center gap-1">
                    <Cake className="w-3 h-3 text-rose-500" />
                    <span className="text-[10px] text-rose-600 font-medium">Birthday!</span>
                  </div>
                )}
                {data.isCurrentUserNode && (
                  <div className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                    <span className="text-[10px] text-emerald-600 font-medium">You</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MemberDetailsViewDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        member={{
          ...data,
          linkedMemberId: data.linkedMemberId,
        }}
        familyId={data.familyId}
      />
    </>
  );
});

FamilyMemberNode.displayName = "FamilyMemberNode";