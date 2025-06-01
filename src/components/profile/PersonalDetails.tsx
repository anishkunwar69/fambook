import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  PencilIcon,
} from "lucide-react";
import React, { useState } from "react";
import { BasicInfoFormDialog } from "./BasicInfoFormDialog";
import { EducationFormDialog } from "./EducationFormDialog";
import { InterestsFormDialog } from "./InterestsFormDialog";
import { WorkHistoryFormDialog } from "./WorkHistoryFormDialog";

// Types based on the API response
type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number;
  endYear: number | null;
  description: string | null;
};

type WorkHistory = {
  id: string;
  company: string;
  position: string;
  startDate: string | Date;
  endDate: string | Date | null;
  currentlyWorking: boolean;
  location: string | null;
  description: string | null;
};

interface PersonalDetailsProps {
  userId: string;
  isCurrentUser: boolean;
  personalDetails: {
    bio?: string | null;
    birthPlace?: string | null;
    currentPlace?: string | null;
    languages?: string[];
    relationshipStatus?: string | null;
    education?: Education[];
    work?: WorkHistory[];
    interests?: string[];
    customFields?: Record<string, any>;
  };
  onPersonalDetailsUpdated?: () => void;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  userId,
  isCurrentUser,
  personalDetails,
  onPersonalDetailsUpdated,
}) => {
  // State for section expansion
  const [expandedSections, setExpandedSections] = useState({
    education: true,
    workExperience: true,
    otherInfo: true,
  });

  // State for dialog visibility
  const [educationDialog, setEducationDialog] = useState<{
    isOpen: boolean;
    education: Education | null;
  }>({ isOpen: false, education: null });

  const [workHistoryDialog, setWorkHistoryDialog] = useState<{
    isOpen: boolean;
    workHistory: WorkHistory | null;
  }>({ isOpen: false, workHistory: null });

  const [interestsDialog, setInterestsDialog] = useState(false);

  // Add state for basic info dialog
  const [basicInfoDialog, setBasicInfoDialog] = useState(false);

  // Function to toggle section expansion
  const toggleSection = (
    section: "education" | "workExperience" | "otherInfo"
  ) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format date function
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle functions for dialogs
  const handleAddEducation = () => {
    setEducationDialog({ isOpen: true, education: null });
  };

  const handleEditEducation = (education: Education) => {
    setEducationDialog({ isOpen: true, education });
  };

  const handleAddWorkHistory = () => {
    setWorkHistoryDialog({ isOpen: true, workHistory: null });
  };

  const handleEditWorkHistory = (workHistory: WorkHistory) => {
    setWorkHistoryDialog({ isOpen: true, workHistory });
  };

  const handleEditInterests = () => {
    setInterestsDialog(true);
  };

  const handleSuccess = () => {
    if (onPersonalDetailsUpdated) {
      onPersonalDetailsUpdated();
    }
  };

  // Add function to handle basic info edit
  const handleEditBasicInfo = () => {
    setBasicInfoDialog(true);
  };

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 relative">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          {isCurrentUser && (
            <Button
              variant="ghost"
              className="absolute right-4 top-4 p-2 h-auto"
              onClick={handleEditBasicInfo}
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </Button>
          )}

          <div className="space-y-4">
            {/* Birth Place */}
            {personalDetails.birthPlace && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Birth Place
                  </h3>
                  <p className="text-base">{personalDetails.birthPlace}</p>
                </div>
              </div>
            )}

            {/* Current Location */}
            {personalDetails.currentPlace && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Current Location
                  </h3>
                  <p className="text-base">{personalDetails.currentPlace}</p>
                </div>
              </div>
            )}

            {/* Relationship Status */}
            {personalDetails.relationshipStatus && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Heart className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Relationship Status
                  </h3>
                  <p className="text-base">
                    {personalDetails.relationshipStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Languages */}
            {personalDetails.languages &&
              personalDetails.languages.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Languages
                    </h3>
                    <p className="text-base">
                      {personalDetails.languages.join(", ")}
                    </p>
                  </div>
                </div>
              )}

            {/* Empty state */}
            {!personalDetails.birthPlace &&
              !personalDetails.currentPlace &&
              !personalDetails.relationshipStatus &&
              (!personalDetails.languages ||
                personalDetails.languages.length === 0) && (
                <p className="text-gray-500 italic">
                  No basic information added yet.
                </p>
              )}

            {/* Add button for empty state */}
            {isCurrentUser &&
              !personalDetails.birthPlace &&
              !personalDetails.currentPlace &&
              !personalDetails.relationshipStatus &&
              (!personalDetails.languages ||
                personalDetails.languages.length === 0) && (
                <div className="mt-4 text-right">
                  <button
                    className="text-rose-600 text-sm font-medium"
                    onClick={handleEditBasicInfo}
                  >
                    + Add Basic Information
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer border-b"
          onClick={() => toggleSection("education")}
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-semibold">Education</h2>
          </div>
          <button className="text-gray-500">
            {expandedSections.education ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        {expandedSections.education && (
          <div className="p-6">
            {personalDetails.education &&
            personalDetails.education.length > 0 ? (
              <div className="space-y-6">
                {personalDetails.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="border-b border-gray-100 pb-6 last:border-0 last:pb-0 relative"
                  >
                    {isCurrentUser && (
                      <Button
                        variant="ghost"
                        className="absolute right-0 top-0 p-2 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEducation(edu);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                    <h3 className="text-lg font-medium pr-8">
                      {edu.institution}
                    </h3>
                    <p className="text-base text-gray-700">
                      {edu.degree}
                      {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {edu.startYear} - {edu.endYear || "Present"}
                    </p>
                    {edu.description && (
                      <p className="mt-2 text-gray-600">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No education information added yet.
              </p>
            )}

            {isCurrentUser && (
              <div className="mt-4 text-right">
                <button
                  className="text-rose-600 text-sm font-medium"
                  onClick={() => handleAddEducation()}
                >
                  + Add Education
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Work Experience Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer border-b"
          onClick={() => toggleSection("workExperience")}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-semibold">Work Experience</h2>
          </div>
          <button className="text-gray-500">
            {expandedSections.workExperience ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        {expandedSections.workExperience && (
          <div className="p-6">
            {personalDetails.work && personalDetails.work.length > 0 ? (
              <div className="space-y-6">
                {personalDetails.work.map((work) => (
                  <div
                    key={work.id}
                    className="border-b border-gray-100 pb-6 last:border-0 last:pb-0 relative"
                  >
                    {isCurrentUser && (
                      <Button
                        variant="ghost"
                        className="absolute right-0 top-0 p-2 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkHistory(work);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                    <h3 className="text-lg font-medium pr-8">
                      {work.position}
                    </h3>
                    <p className="text-base text-gray-700">{work.company}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(work.startDate)} -{" "}
                      {work.currentlyWorking
                        ? "Present"
                        : work.endDate
                          ? formatDate(work.endDate)
                          : ""}
                    </p>
                    {work.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {work.location}
                      </p>
                    )}
                    {work.description && (
                      <p className="mt-2 text-gray-600">{work.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No work experience added yet.
              </p>
            )}

            {isCurrentUser && (
              <div className="mt-4 text-right">
                <button
                  className="text-rose-600 text-sm font-medium"
                  onClick={() => handleAddWorkHistory()}
                >
                  + Add Work Experience
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Other Information Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer border-b"
          onClick={() => toggleSection("otherInfo")}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-semibold">Other Information</h2>
          </div>
          <button className="text-gray-500">
            {expandedSections.otherInfo ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        {expandedSections.otherInfo && (
          <div className="p-6">
            <div className="space-y-4">
              {/* Interests & Hobbies */}
              {personalDetails.interests &&
                personalDetails.interests.length > 0 && (
                  <div className="relative">
                    {isCurrentUser && (
                      <Button
                        variant="ghost"
                        className="absolute right-0 top-0 p-2 h-auto"
                        onClick={() => handleEditInterests()}
                      >
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                    <h3 className="text-base font-medium text-gray-700 mb-2 pr-8">
                      Interests & Hobbies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {personalDetails.interests.map((interest) => (
                        <Badge
                          key={interest}
                          variant="secondary"
                          className="bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Custom Fields */}
              {personalDetails.customFields &&
                Object.keys(personalDetails.customFields).length > 0 && (
                  <div className="mt-4">
                    {Object.entries(personalDetails.customFields).map(
                      ([key, value]) => (
                        <div key={key} className="mt-3">
                          <h3 className="text-base font-medium text-gray-700">
                            {key}
                          </h3>
                          <p className="text-gray-600">{value}</p>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Empty state */}
              {(!personalDetails.interests ||
                personalDetails.interests.length === 0) &&
                (!personalDetails.customFields ||
                  Object.keys(personalDetails.customFields).length === 0) && (
                  <p className="text-gray-500 italic">
                    No additional information added yet.
                  </p>
                )}
            </div>

            {isCurrentUser &&
              (!personalDetails.interests ||
                personalDetails.interests.length === 0) && (
                <div className="mt-4 text-right">
                  <button
                    className="text-rose-600 text-sm font-medium"
                    onClick={() => handleEditInterests()}
                  >
                    + Add Interests & Hobbies
                  </button>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {isCurrentUser && (
        <>
          <BasicInfoFormDialog
            isOpen={basicInfoDialog}
            onClose={() => setBasicInfoDialog(false)}
            userId={userId}
            basicInfo={{
              bio: personalDetails.bio,
              birthPlace: personalDetails.birthPlace,
              currentPlace: personalDetails.currentPlace,
              relationshipStatus: personalDetails.relationshipStatus,
              languages: personalDetails.languages,
            }}
            onSuccess={() => {
              setBasicInfoDialog(false);
              handleSuccess();
            }}
          />

          <EducationFormDialog
            isOpen={educationDialog.isOpen}
            onClose={() =>
              setEducationDialog({ isOpen: false, education: null })
            }
            userId={userId}
            education={educationDialog.education}
            onSuccess={() => {
              setEducationDialog({ isOpen: false, education: null });
              handleSuccess();
            }}
          />

          <WorkHistoryFormDialog
            isOpen={workHistoryDialog.isOpen}
            onClose={() =>
              setWorkHistoryDialog({ isOpen: false, workHistory: null })
            }
            userId={userId}
            workHistory={workHistoryDialog.workHistory}
            onSuccess={() => {
              setWorkHistoryDialog({ isOpen: false, workHistory: null });
              handleSuccess();
            }}
          />

          <InterestsFormDialog
            isOpen={interestsDialog}
            onClose={() => setInterestsDialog(false)}
            userId={userId}
            interests={personalDetails.interests || []}
            onSuccess={() => {
              setInterestsDialog(false);
              handleSuccess();
            }}
          />
        </>
      )}
    </div>
  );
};

export default PersonalDetails;
