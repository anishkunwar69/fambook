import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Award,
  Baby,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useInView } from "react-intersection-observer";
import { AddLifeEventDialog } from "./AddLifeEventDialog";

// Define types
type LifeEventDisplay = {
  id: string;
  title: string;
  eventDate: string | Date;
  location?: string | null;
  eventType: string;
};

type YearGroup = {
  year: number;
  events: LifeEventDisplay[];
};

interface LifeTimelineProps {
  userId: string;
  isCurrentUser: boolean;
}

const EVENTS_PER_PAGE = 10;

export function LifeTimeline({ userId, isCurrentUser }: LifeTimelineProps) {
  const queryClient = useQueryClient();
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {}
  );
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LifeEventDisplay | null>(
    null
  );
  // State to track actual user ownership based on API response
  const [isActuallyCurrentUser, setIsActuallyCurrentUser] =
    useState(isCurrentUser);

  // Intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  // Debug log for props
  console.log("LifeTimeline props:", { userId, isCurrentUser });

  // Fetch life events with infinite scrolling
  const {
    data: eventsPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["lifeEvents", userId],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const searchParams = new URLSearchParams({
          page: pageParam.toString(),
          limit: EVENTS_PER_PAGE.toString(),
        });

        const response = await fetch(
          `/api/users/${userId}/life-events?${searchParams}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch life events");
        }
        const responseData = await response.json();
        console.log("Life events API response:", responseData);

        // Update the user ownership based on API response (only on first page)
        if (pageParam === 1 && responseData.isSelf !== undefined) {
          setIsActuallyCurrentUser(responseData.isSelf);

          // Log if there's a discrepancy
          if (responseData.isSelf !== isCurrentUser) {
            console.warn("API isSelf value differs from prop:", {
              apiIsSelf: responseData.isSelf,
              propIsCurrentUser: isCurrentUser,
            });
          }
        }

        return responseData;
      } catch (error) {
        console.error("Error fetching life events:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.pagination?.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Load more events when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Combine all year groups from all pages
  const allYearGroups: YearGroup[] =
    eventsPages?.pages.flatMap((page) => page.data) || [];

  // Merge year groups with the same year from different pages
  const mergedYearGroups = allYearGroups.reduce(
    (acc: YearGroup[], currentGroup: YearGroup) => {
      const existingGroup = acc.find(
        (group) => group.year === currentGroup.year
      );
      if (existingGroup) {
        // Add events to existing year group, avoiding duplicates
        const existingEventIds = existingGroup.events.map((e) => e.id);
        const newEvents = currentGroup.events.filter(
          (e) => !existingEventIds.includes(e.id)
        );
        existingGroup.events.push(...newEvents);
      } else {
        acc.push(currentGroup);
      }
      return acc;
    },
    []
  );

  // Sort merged year groups by year descending
  const sortedYearGroups = mergedYearGroups.sort((a, b) => b.year - a.year);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/life-events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete event");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Event deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["lifeEvents", userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsAddEventOpen(true);
  };

  const handleEditEvent = (event: LifeEventDisplay) => {
    setSelectedEvent(event);
    setIsAddEventOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(eventId);
    }
  };

  const handleDialogClose = () => {
    setIsAddEventOpen(false);
    setSelectedEvent(null);
  };

  const handleSuccess = () => {
    setIsAddEventOpen(false);
    setSelectedEvent(null);

    // Just invalidate queries - toast is now handled in the dialog
    queryClient.invalidateQueries({ queryKey: ["lifeEvents", userId] });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "birth":
        return <Baby className="h-5 w-5 text-rose-500" />;
      case "marriage":
      case "married":
        return <Heart className="h-5 w-5 text-rose-500" />;
      case "job":
      case "work":
        return <Briefcase className="h-5 w-5 text-rose-500" />;
      case "move":
      case "moved":
        return <Home className="h-5 w-5 text-rose-500" />;
      case "graduation":
      case "education":
        return <GraduationCap className="h-5 w-5 text-rose-500" />;
      case "award":
        return <Award className="h-5 w-5 text-rose-500" />;
      default:
        return <Calendar className="h-5 w-5 text-rose-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Timeline Skeleton */}
        <div className="space-y-12">
          {/* Year Group 1 */}
          <div className="relative">
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-0.5 w-full bg-gray-100"></div>
            </div>

            <div className="pl-6 border-l-2 border-gray-100 space-y-8 ml-2">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-[22px] top-0 w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
                  <div className="flex justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <div className="absolute -left-[22px] top-0 w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
                  <div className="flex justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-56 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Year Group 2 */}
          <div className="relative">
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-0.5 w-full bg-gray-100"></div>
            </div>

            <div className="pl-6 border-l-2 border-gray-100 space-y-8 ml-2">
              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-[22px] top-0 w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
                  <div className="flex justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-44 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[22px] top-0 w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
                  <div className="flex justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-44 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[22px] top-0 w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
                  <div className="flex justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-44 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">
          Failed to load life events. Please try again later.
        </p>
        {isActuallyCurrentUser && (
          <Button
            onClick={handleAddEvent}
            className="mt-4 bg-rose-500 hover:bg-rose-600"
          >
            <Plus className="h-4 w-4 mr-2" /> Try Adding an Event
          </Button>
        )}
      </div>
    );
  }

  // Debug log for render conditions
  console.log("Render conditions:", {
    yearGroupsLength: sortedYearGroups.length,
    isCurrentUser,
    isActuallyCurrentUser,
    isLoading,
    isError,
    hasData: !!eventsPages,
  });

  return (
    <div
      className={`${sortedYearGroups.length > 0 ? "space-y-8" : "space-y-0"}`}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold font-lora text-rose-500 hidden sm:block">
          Life Timeline
        </h2>
        {isActuallyCurrentUser && sortedYearGroups.length > 0 && (
          <Button
            onClick={handleAddEvent}
            className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2 sm:w-auto w-full sm:bg-rose-500 sm:hover:bg-rose-600 sm:text-white sm:border-transparent sm:dark:bg-rose-600 sm:dark:hover:bg-rose-700 
            hidden sm:flex"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        )}
        {isActuallyCurrentUser && sortedYearGroups.length > 0 && (
          <Button
            onClick={handleAddEvent}
            variant="outline"
            className="w-full sm:hidden flex items-center justify-center gap-2 border-rose-500 text-rose-500 hover:bg-rose-50 dark:border-rose-400 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        )}
      </div>

      {sortedYearGroups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-5">No life events added yet.</p>
          {isActuallyCurrentUser && (
            <Button
              onClick={handleAddEvent}
              className="bg-rose-500 hover:bg-rose-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Life Event
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {sortedYearGroups.map((yearGroup: YearGroup) => (
            <div key={yearGroup.year} className="relative">
              <div className="mb-4">
                <h3 className="text-xl font-medium text-rose-600">
                  {yearGroup.year}
                </h3>
                <div className="h-0.5 w-full bg-rose-100"></div>
              </div>

              <div className="pl-6 border-l-2 border-rose-100 space-y-8 ml-2">
                {yearGroup.events.map((event: LifeEventDisplay) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[22px] top-0 w-4 h-4 bg-rose-500 rounded-full"></div>
                    <Card className="p-4 shadow-sm hover:shadow transition-shadow">
                      <div className="flex justify-between">
                        <div className="flex items-start gap-3">
                          <div className="bg-rose-50 p-2 rounded-full">
                            {getEventIcon(event.eventType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {event.title}
                            </h4>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(event.eventDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />{" "}
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleEventExpansion(event.id)}
                          >
                            {expandedEvents[event.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {expandedEvents[event.id] && isActuallyCurrentUser && (
                        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="flex justify-center max-sm:">
            {isFetchingNextPage ? (
              <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
            ) : hasNextPage ? (
              <span className="text-gray-500">Loading more events...</span>
            ) : sortedYearGroups.length > 0 ? (
              <span className="flex items-center gap-2 text-sm text-rose-600 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm">
                <span className="text-2xl">📅</span>
                All events loaded
              </span>
            ) : null}
          </div>

          {/* "Add Another Event" button at the bottom when user has existing events */}
        </div>
      )}

      {/* Add Life Event Dialog */}
      <AddLifeEventDialog
        isOpen={isAddEventOpen}
        onClose={handleDialogClose}
        userId={userId}
        event={
          selectedEvent
            ? {
                id: selectedEvent.id,
                title: selectedEvent.title,
                eventDate:
                  typeof selectedEvent.eventDate === "string"
                    ? selectedEvent.eventDate
                    : selectedEvent.eventDate.toISOString(),
                location: selectedEvent.location,
                eventType: selectedEvent.eventType,
              }
            : null
        }
        onSuccess={handleSuccess}
      />
    </div>
  );
}
