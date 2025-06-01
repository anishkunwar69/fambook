"use client";

import { AddEventForm } from "@/components/forms/add-event-form";
import { EditEventForm } from "@/components/forms/edit-event-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format, isPast, isSameDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Cake,
  Calendar as CalendarIcon,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Heart,
  Home,
  Info,
  Loader2,
  MapPin,
  PartyPopper,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { LiaRingSolid } from "react-icons/lia";

type TimeFrame = "ALL" | "THIS WEEK" | "THIS MONTH" | "THIS YEAR";
type EventType =
  | "BIRTHDAY"
  | "ANNIVERSARY"
  | "WEDDING"
  | "GRADUATION"
  | "HOLIDAY"
  | "OTHER";

type SpecialDay = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  venue: string | null;
  type: EventType;
  familyId: string;
  createdAt: string;
  family?: {
    id: string;
    name: string;
  };
  albums?: {
    id: string;
  }[];
  isFamilyAdmin?: boolean;
};

const eventTypes: EventType[] = [
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING",
  "GRADUATION",
  "HOLIDAY",
  "OTHER",
];

const eventTypeIcons: Record<EventType, React.ElementType> = {
  BIRTHDAY: Cake,
  ANNIVERSARY: Heart,
  WEDDING: LiaRingSolid,
  GRADUATION: GraduationCap,
  HOLIDAY: PartyPopper,
  OTHER: Star,
};

const eventTypeColors: Record<EventType, string> = {
  BIRTHDAY: "bg-blue-100 text-blue-500",
  ANNIVERSARY: "bg-rose-100 text-rose-500",
  WEDDING: "bg-purple-100 text-purple-500",
  GRADUATION: "bg-green-100 text-green-500",
  HOLIDAY: "bg-amber-100 text-amber-500",
  OTHER: "bg-gray-100 text-gray-500",
};

// Add debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const EVENTS_PER_PAGE = 6;

// Skeleton Card Component for Events
function EventSkeletonCard() {
  return (
    <div className="relative group rounded-xl border border-gray-100 bg-white/80 p-6 animate-pulse">
      {/* Skeleton Event Type Icon */}
      <div className="absolute -top-3 -right-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 border-4 border-white"></div>
      </div>

      {/* Skeleton Status Badge */}
      <div className="absolute top-2 left-2">
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      </div>

      {/* Skeleton Main Content */}
      <div className="mb-4 mt-6">
        <div className="flex flex-col gap-1 mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div> {/* Day */}
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>{" "}
          {/* Month Day */}
          <div className="h-4 bg-gray-200 rounded w-1/4"></div> {/* Year */}
        </div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div> {/* Title */}
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>{" "}
        {/* Family Name */}
        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>{" "}
        {/* Description Line 1 */}
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>{" "}
        {/* Description Line 2 */}
      </div>

      {/* Skeleton Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="h-5 bg-gray-200 rounded-full w-24"></div>{" "}
        {/* Event Type */}
        <div className="h-5 bg-gray-200 rounded w-20"></div> {/* Days Until */}
      </div>

      {/* Skeleton Album Button */}
      <div className="absolute bottom-4 right-4">
        <div className="h-8 bg-gray-200 rounded-md w-28"></div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventType | "ALL">(
    "ALL"
  );
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<SpecialDay | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPastEventTip, setShowPastEventTip] = useState(true);

  // State for Edit Event Modal
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<SpecialDay | null>(null);

  // State for Delete Event Modal
  const [isDeleteEventConfirmModalOpen, setIsDeleteEventConfirmModalOpen] =
    useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);
  const [eventToDeleteName, setEventToDeleteName] = useState<string | "">("");

  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/special-days/${eventId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete event");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Event deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["special-days"] });
      setIsDeleteEventConfirmModalOpen(false);
      setEventToDeleteId(null);
      setEventToDeleteName("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  // Debounced search handler
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500),
    []
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Fetch events based on selected time frame
  const { data: events, isLoading } = useQuery({
    queryKey: ["special-days", timeFrame],
    queryFn: async () => {
      const timeFrameParam =
        timeFrame === "ALL" ? "all" : timeFrame.toLowerCase().replace(" ", "");
      const response = await fetch(
        `/api/special-days?timeFrame=${timeFrameParam}`
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  // Fetch user's families
  const { data: families } = useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  // Filter events based on search query, category, and family
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    const initiallyFiltered = events.filter((event: SpecialDay) => {
      const matchesSearch =
        event.title
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        (event.description
          ?.toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ??
          false);

      const matchesCategory =
        selectedCategory === "ALL" || event.type === selectedCategory;

      const matchesFamily =
        selectedFamily === "ALL" || event.familyId === selectedFamily;

      return matchesSearch && matchesCategory && matchesFamily;
    });

    // Sort events by date in descending order
    return initiallyFiltered.sort(
      (a: SpecialDay, b: SpecialDay) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [events, debouncedSearchQuery, selectedCategory, selectedFamily]);

  // Sort and paginate events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  const getEventStatus = (date: string) => {
    const eventDate = new Date(date);
    const now = new Date();
    const daysUntil = differenceInDays(eventDate, now);

    if (isPast(eventDate) && !isSameDay(eventDate, now)) {
      return "Occurred";
    }

    if (isSameDay(eventDate, now)) {
      return "Today";
    }

    if (daysUntil <= 7) {
      return "Coming Soon";
    }

    return "Upcoming";
  };

  const hasPastEvents = useMemo(() => {
    if (!events) return false;
    return filteredEvents.some(
      (event: SpecialDay) => getEventStatus(event.date) === "Occurred"
    );
  }, [filteredEvents, events, getEventStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Occurred":
        return "text-gray-500";
      case "Today":
        return "text-green-500";
      case "Coming Soon":
        return "text-amber-500";
      default:
        return "text-blue-500";
    }
  };

  const getDaysUntilEvent = (date: string) => {
    const eventDate = new Date(date);
    const now = new Date();
    const daysUntil = differenceInDays(eventDate, now);

    if (isPast(eventDate) && !isSameDay(eventDate, now)) {
      return `${Math.abs(daysUntil)} days ago`;
    }

    if (isSameDay(eventDate, now)) {
      return "Today";
    }

    return `in ${daysUntil} days`;
  };

  const getEventIcon = (type: EventType) => {
    const Icon = eventTypeIcons[type];
    return <Icon className="w-4 h-4" />;
  };

  const handleViewDetails = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleCreateAlbumClick = (e: React.MouseEvent, event: SpecialDay) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowCreateModal(true);
  };

  const handleCreateEventAlbum = async (
    eventId: string,
    eventTitle: string,
    familyId: string
  ) => {
    try {
      setIsCreatingAlbum(true);
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${eventTitle} Album`,
          description: `Photos and memories from ${eventTitle}`,
          familyIds: [familyId],
          eventId: eventId,
          mediaLimit: 100,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Error creating album:", result.errors || result.message);
        throw new Error(result.message);
      }

      toast.success("Album created successfully!");
      queryClient.invalidateQueries({ queryKey: ["special-days", timeFrame] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create album"
      );
    } finally {
      setIsCreatingAlbum(false);
      setShowCreateModal(false);
    }
  };

  // Update time frame handler
  const handleTimeFrameChange = (value: TimeFrame) => {
    setTimeFrame(value);
  };

  const handleEditEventClick = (event: SpecialDay) => {
    setEventToEdit(event);
    setIsEditEventModalOpen(true);
  };

  const handleDeleteEventClick = (event: SpecialDay) => {
    setEventToDeleteId(event.id);
    setEventToDeleteName(event.title);
    setIsDeleteEventConfirmModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Events</span>
      </motion.div>

      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 mb-8"
        >
          <div className="flex flex-col gap-6">
            {/* Title and Add Event Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-lora font-bold text-gray-800 mb-2">
                  Family Events 🎉
                </h1>
                <p className="text-gray-600">
                  Keep track of all your family's special moments
                </p>
              </div>
              <DialogTrigger asChild>
                <Button className="bg-rose-500 hover:bg-rose-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Time Frame Filter */}
              <Select
                value={timeFrame}
                onValueChange={(value: TimeFrame) =>
                  handleTimeFrameChange(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Events</SelectItem>
                  <SelectItem value="THIS WEEK">This Week</SelectItem>
                  <SelectItem value="THIS MONTH">This Month</SelectItem>
                  <SelectItem value="THIS YEAR">This Year</SelectItem>
                </SelectContent>
              </Select>

              {/* Family Filter */}
              <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Families</SelectItem>
                  {families?.map((family: any) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={(value: EventType | "ALL") =>
                  setSelectedCategory(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full ${eventTypeColors[type as keyof typeof eventTypeColors]} flex items-center justify-center`}
                        >
                          {getEventIcon(type as keyof typeof eventTypeIcons)}
                        </div>
                        <span>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Dismissible Tip for Past Events */}
        {hasPastEvents && showPastEventTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-start gap-3 text-sm text-sky-700 shadow-sm"
          >
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <p className="font-medium">Keep your event list tidy!</p>
              <p className="text-sky-600">
                You can safely delete past events. Don&apos;t worry, any albums
                created for these events won&apos;t be deleted{" "}
                <span className="text-xl">🫶🏻</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-sky-500 hover:bg-sky-100 hover:text-sky-700 -mr-2 -mt-2 h-8 w-8"
              onClick={() => setShowPastEventTip(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Events Grid */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div key="loading-skeletons" className="contents">
                  {[...Array(EVENTS_PER_PAGE)].map((_, index) => (
                    <EventSkeletonCard key={`skeleton-${index}`} />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center border border-rose-100/50"
                >
                  <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarIcon className="w-8 h-8 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
                    No Events Found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {debouncedSearchQuery
                      ? "No events match your search criteria. Try adjusting your search or filters."
                      : "Start adding special events to keep track of important dates!"}
                  </p>
                  <DialogTrigger asChild>
                    <Button className="bg-rose-500 hover:bg-rose-600">
                      Add Your First Event
                    </Button>
                  </DialogTrigger>
                </motion.div>
              ) : (
                paginatedEvents.map((event: SpecialDay, index: number) => {
                  const eventDate = new Date(event.date);
                  const status = getEventStatus(event.date);

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative group rounded-xl border p-6 transition-all duration-300 backdrop-blur-sm ${
                        status === "Occurred"
                          ? "bg-gray-100 border-gray-300 opacity-70 filter grayscale hover:opacity-100 hover:filter-none"
                          : "bg-white/80 border-gray-100 hover:border-rose-200 hover:shadow-lg"
                      }`}
                    >
                      {/* Edit and Delete buttons for family admin */}
                      {event.isFamilyAdmin && (
                        <div className="absolute top-2 right-2 z-10 flex items-center space-x-1 pr-5 pt-2">
                          <div className="bg-gray-100 backdrop-blur-sm p-0.5 rounded-md shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 w-7 h-7"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click if any
                                handleEditEventClick(event);
                              }}
                              title="Edit Event"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="bg-gray-100 backdrop-blur-sm p-0.5 rounded-md shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-red-500 hover:bg-red-50/50 w-7 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEventClick(event);
                              }}
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Event Type Icon */}
                      <div className="absolute -top-3 -right-3">
                        <div
                          className={`w-10 h-10 rounded-full ${eventTypeColors[event.type]} flex items-center justify-center border-4 border-white shadow-sm`}
                        >
                          {getEventIcon(
                            event.type as keyof typeof eventTypeIcons
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(status)}`}
                        >
                          {status === "Occurred" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {status}
                        </span>
                      </div>

                      {/* Main Content */}
                      <div className="mb-4 mt-6">
                        <div className="flex flex-col gap-1 mb-3">
                          <div className="text-sm font-medium text-gray-500">
                            {format(eventDate, "EEEE")}
                          </div>
                          <div className="text-2xl font-bold text-gray-800">
                            {format(eventDate, "MMMM d")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(eventDate, "yyyy")}
                          </div>
                        </div>

                        <h3 className="text-xl font-semibold text-rose-500 mb-2 pr-6">
                          {event.title}
                        </h3>
                        {event.family && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600 bg-gray-100/80 px-2 py-1 rounded-full">
                              {event.family.name}
                            </span>
                          </div>
                        )}
                        {event.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {event.description}
                          </p>
                        )}

                        {/* Time and Venue Information */}
                        {(event.time || event.venue) && (
                          <div className="space-y-1 mb-2">
                            {event.time && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4 text-rose-400" />
                                <span>{event.time}</span>
                              </div>
                            )}
                            {event.venue && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-rose-400" />
                                <span>{event.venue}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${eventTypeColors[event.type]}`}
                        >
                          {event.type.charAt(0) +
                            event.type.slice(1).toLowerCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getDaysUntilEvent(event.date)}
                        </span>
                      </div>

                      {/* Album Status Badge */}
                      <div className="absolute bottom-4 right-4">
                        {event.albums && event.albums.length > 0 ? (
                          <Link href={`/albums/${event.albums[0].id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                            >
                              <Camera className="w-4 h-4" />
                              View Album
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 text-rose-500 hover:text-rose-600"
                            onClick={(e) => handleCreateAlbumClick(e, event)}
                          >
                            <Camera className="w-4 h-4" />
                            Create Album
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 ${
                        pageNum === currentPage
                          ? "bg-rose-500 hover:bg-rose-600"
                          : ""
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Add Event Dialog Content */}
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="font-lora text-2xl text-rose-500">
              Add New Event
            </DialogTitle>
          </DialogHeader>
          <AddEventForm onSuccess={() => setIsAddEventOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      {eventToEdit && (
        <Dialog
          open={isEditEventModalOpen}
          onOpenChange={setIsEditEventModalOpen}
        >
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="font-lora text-2xl text-blue-600">
                Edit Event
              </DialogTitle>
            </DialogHeader>
            <EditEventForm
              eventToEdit={eventToEdit}
              onSuccess={() => {
                setIsEditEventModalOpen(false);
                setEventToEdit(null);
                // invalidate query already handled in EditEventForm
              }}
              onCancel={() => {
                setIsEditEventModalOpen(false);
                setEventToEdit(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDeleteId && (
        <Dialog
          open={isDeleteEventConfirmModalOpen}
          onOpenChange={setIsDeleteEventConfirmModalOpen}
        >
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirm Event Deletion
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete the event "
                <strong>{eventToDeleteName}</strong>"? This action cannot be
                undone. Associated albums will{" "}
                <span className="font-semibold">not</span> be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteEventConfirmModalOpen(false);
                  setEventToDeleteId(null);
                  setEventToDeleteName("");
                }}
                disabled={deleteEventMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  eventToDeleteId && deleteEventMutation.mutate(eventToDeleteId)
                }
                disabled={deleteEventMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleteEventMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  "Delete Event"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Event Album Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event Album</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Create a dedicated album for "{selectedEvent?.title}" to store all
              related photos and memories.
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-2 p-4 bg-rose-50 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-rose-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {selectedEvent?.title}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedEvent?.date &&
                    format(new Date(selectedEvent.date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingAlbum}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedEvent &&
                  handleCreateEventAlbum(
                    selectedEvent.id,
                    selectedEvent.title,
                    selectedEvent.familyId
                  )
                }
                disabled={isCreatingAlbum}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {isCreatingAlbum ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Album"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
