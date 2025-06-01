import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalFamilyRootSkeletonCard() {
  return (
    <Card className="bg-white/80 backdrop-blur-md border-rose-100/50">
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-6 w-3/5" /> {/* Root Name */}
          <Skeleton className="h-5 w-5" /> {/* Share Icon */}
        </div>
        <Skeleton className="h-4 w-1/2" /> {/* Created by */}
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
        <Skeleton className="h-4 w-5/6" /> {/* Description line 2 */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* Users Icon */}
            <Skeleton className="h-4 w-16" /> {/* Members count */}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* GitFork Icon */}
            <Skeleton className="h-4 w-20" /> {/* Connections count */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 