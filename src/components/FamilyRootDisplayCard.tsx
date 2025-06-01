import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Family } from "@/types/family.types"; // Assuming you have a Family type
import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";

interface FamilyRootDisplayCardProps {
  family: Family;
}

export default function FamilyRootDisplayCard({
  family,
}: FamilyRootDisplayCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="w-5 h-5 mr-2 text-rose-500" />
          Root of {family.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mb-4">
          This is the central communication space for the {family.name} family.
        </p>
        {/* Placeholder for future content or quick actions */}
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
        <Button
          asChild
          variant="ghost"
          className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          {/* For now, this button can link to the family\'s feed or a placeholder page
              Let\'s link it to the family\'s feed for now, assuming a familyId query param exists */}
          <Link
            href={`/families/${family.id}/roots`}
            className="flex items-center justify-center"
          >
            View Family Roots <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
