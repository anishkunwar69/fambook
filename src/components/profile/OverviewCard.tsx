import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Heart, Calendar } from "lucide-react";

// Define types for the component
type OverviewCardData = {
  bio?: string;
  birthPlace?: string;
  currentPlace?: string;
  relationshipStatus?: string;
};

export function OverviewCard({
  userId,
  details,
  isCurrentUser,
}: {
  userId: string;
  details: OverviewCardData;
  isCurrentUser: boolean;
}) {
  // Check if we have any content to display
  const hasContent = !!(
    details?.birthPlace ||
    details?.currentPlace ||
    details?.relationshipStatus
  );
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Personal Details</CardTitle>
        <CardDescription>
          {details.bio || ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasContent ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">
              {isCurrentUser
                ? "You haven't added any personal details yet."
                : "This person hasn't added any personal details yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              {details?.birthPlace && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Birth Place</div>
                    <div className="text-sm">{details.birthPlace}</div>
                  </div>
                </div>
              )}

              {details?.currentPlace && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Lives in</div>
                    <div className="text-sm">{details.currentPlace}</div>
                  </div>
                </div>
              )}

              {details?.relationshipStatus && (
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Relationship Status</div>
                    <div className="text-sm">{details.relationshipStatus}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
