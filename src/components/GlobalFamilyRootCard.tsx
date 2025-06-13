import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitFork, Share2, Trash2, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

// We'll need to ensure the FamilyRoot type from that page, or a new one, includes familyId and familyName.
// For now, let's define an extended type here if necessary, or assume it's passed.
// export interface GlobalFamilyRoot extends FamilyRoot {
//   familyId: string;
//   familyName: string; // To display as a badge or context if needed
// }

// Redefined GlobalFamilyRoot interface
export interface GlobalFamilyRoot {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string; // Or Date, ensure type matches API response
  createdBy: {
    // id: string; // Not used in card, can be removed from here if not needed elsewhere
    fullName: string | null;
    imageUrl: string | null;
  };
  _count: {
    nodes: number;
    relations: number;
  };
  family: {
    // Changed from familyName and familyId to nested family object
    id: string;
    name: string;
    familyPhoto?: string | null; // Add if you plan to use it
  };
  isAdmin: boolean; // Added for conditional rendering of delete button
  // familyId: string; // This is for linking, from root.family.id - REMOVED, use root.family.id
  // familyName: string; // For display - REMOVED, use root.family.name
}

interface GlobalFamilyRootCardProps {
  root: GlobalFamilyRoot;
  onDelete: (root: { id: string; name: string }) => void; // Function to trigger delete modal
}

export default function GlobalFamilyRootCard({
  root,
  onDelete,
}: GlobalFamilyRootCardProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link from navigating
    e.stopPropagation(); // Stop event bubbling
    onDelete({ id: root.id, name: root.name });
  };

  return (
    <div className="h-full block relative">
      {" "}
      {/* Use a div wrapper for positioning context */}
      {/* Admin Delete Button */}
      {root.isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 text-gray-400 hover:text-red-500 hover:bg-red-50/50 h-10 w-10 mt-[13px]"
          onClick={handleDeleteClick}
          title="Delete Family Tree"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
      <Link
        href={`/families/${root.family.id}/roots/${root.id}`}
        className="h-full block"
      >
        <Card className="bg-white/80 backdrop-blur-md border-rose-100/50 hover:border-rose-200 transition-all duration-300 hover:shadow-lg group flex flex-col h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl font-lora text-rose-600 transition-colors mb-1 pr-8">
                {" "}
                {/* Add padding to prevent overlap with button */}
                {root.name}
              </CardTitle>
              {root.isPublic && (
                <Share2 className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              )}
            </div>
            <CardDescription className="text-xs">
              Part of:{" "}
              <Badge variant="outline" className="ml-1">
                {root.family.name}
              </Badge>
            </CardDescription>
            <CardDescription className="mt-1 sm:text-sm text-xs">
              Created by {root.createdBy.fullName}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              {root.description ? (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {root.description}
                </p>
              ) : (
                <p className="sm:text-sm text-xs text-gray-400 italic">
                  No description provided.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3 mt-auto">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <span>{root._count.nodes} members</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-rose-500" />
                <span>{root._count.relations} connections</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
