import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowDown,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Info,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const steps = [
  {
    title: "Admin Privileges",
    content:
      "Only admins can add and edit member nodes in the family tree. Regular members can only view the tree.",
    icon: <Info className="sm:w-5 sm:h-5 w-4 h-4" />,
  },
  {
    title: "Deleting Nodes",
    content:
      "Only nodes without relationships can be deleted. Once relationships are created, nodes can only be edited.",
    icon: <X className="sm:w-5 sm:h-5 w-4 h-4" />,
  },
  {
    title: "Creating Relationships",
    content:
      "First add all family members before creating connections. This helps organize your tree structure properly.",
    icon: <Users className="sm:w-5 sm:h-5 w-4 h-4" />,
  },
  {
    title: "Spouse Connections",
    content:
      "Connect male's bottom dot to female's bottom dot to establish a spouse relationship between two members.",
    icon: <ArrowLeftRight className="sm:w-5 sm:h-5 w-4 h-4" />,
    visual: {
      type: "spouse",
      description: "Male → Female (bottom to bottom)",
    },
  },
  {
    title: "Parent-Child Connections",
    content:
      "Connect parent's bottom dot to child's top dot. Start with the father's node for best results.",
    icon: <ArrowDown className="sm:w-5 sm:h-5 w-4 h-4" />,
    visual: {
      type: "parent-child",
      description: "Parent → Child (bottom to top)",
    },
  },
  {
    title: "Member Details",
    content:
      "Click any node to view detailed information about that family member, including their profile and relationships.",
    icon: <Info className="sm:w-5 sm:h-5 w-4 h-4" />,
  },
  {
    title: "Linked Members",
    content:
      "Admins can link FamBook users to their family nodes, allowing access to their full profiles when clicked.",
    icon: <Users className="sm:w-5 sm:h-5 w-4 h-4" />,
  },
  {
    title: "Perfect Tree Example",
    content:
      "Here's how a well-structured family tree should look with proper relationships.",
    icon: <Users className="sm:w-5 sm:h-5 w-4 h-4" />,
    image: "/perfect-tree.png",
  },
];

export function FamilyTreeGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPulsing, setIsPulsing] = useState(true);

  // Stop pulsing after 5 seconds or when the guide is opened
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulsing(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenGuide = () => {
    setIsOpen(true);
    setIsPulsing(false);
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className={`bg-white hover:bg-gray-50 text-gray-900 shadow-sm gap-2 rounded-full px-4 py-2 border border-gray-200 relative ${
          isPulsing ? "animate-pulse ring-2 ring-rose-300 ring-opacity-75" : ""
        }`}
        onClick={handleOpenGuide}
      >
        <Users className="w-4 h-4 text-rose-500" />
        <span className="font-medium">Family Tree Guide</span>
        {isPulsing && (
          <span className="absolute -right-1 -top-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            !
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 bg-white overflow-hidden rounded-lg border-2 border-rose-100 shadow-lg">
          <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
            <DialogTitle className="sm:text-lg text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="sm:w-5 sm:h-5 w-4 h-4 text-rose-500" />
              Family Tree Guide
            </DialogTitle>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-1.5">
            <div
              className="bg-rose-500 h-1.5 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 rounded-full text-rose-600">
                {steps[currentStep].icon}
              </div>
              <h3 className="sm:text-lg text-base font-medium text-gray-900">
                {steps[currentStep].title}
              </h3>
            </div>

            <p className="text-gray-700 mb-5 leading-relaxed sm:text-base text-sm">
              {steps[currentStep].content}
            </p>

            {steps[currentStep].visual && (
              <div className="bg-rose-50 rounded-lg p-4 mb-5 border border-rose-100">
                <div className="flex items-center gap-2 mb-3">
                  {steps[currentStep].visual.type === "spouse" ? (
                    <ArrowLeftRight className="w-4 h-4 text-rose-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-rose-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {steps[currentStep].visual.description}
                  </span>
                </div>

                {steps[currentStep].visual.type === "spouse" && (
                  <div className="flex justify-center items-center gap-10 mt-3">
                    <div className="relative">
                      <div className="w-16 h-20 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200 text-sm font-medium">
                        Male
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                    </div>
                    <ArrowLeftRight className="w-5 h-5 text-rose-400" />
                    <div className="relative">
                      <div className="w-16 h-20 bg-pink-100 rounded-lg flex items-center justify-center border border-pink-200 text-sm font-medium">
                        Female
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                    </div>
                  </div>
                )}

                {steps[currentStep].visual.type === "parent-child" && (
                  <div className="flex flex-col items-center gap-6 mt-3">
                    <div className="relative">
                      <div className="w-16 h-20 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200 text-sm font-medium">
                        Parent
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                    </div>
                    <div className="h-4 w-px bg-rose-400 relative">
                      <ArrowDown className="w-5 h-5 text-rose-400 absolute -bottom-4 left-1/2 transform -translate-x-1/2" />
                    </div>
                    <div className="relative">
                      <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 text-sm font-medium">
                        Child
                      </div>
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {steps[currentStep].image && (
              <div className="bg-rose-50 rounded-lg p-4 mb-5 border border-rose-100">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Example of a well-structured family tree
                </p>
                <div className="relative w-full h-[200px] sm:h-[250px] overflow-hidden rounded-md">
                  <Image
                    src={steps[currentStep].image}
                    alt="Perfect family tree example"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 0}
                className="h-9 px-3 border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                <ChevronLeft className="sm:w-4 sm:h-4 w-3 h-3 mr-1" />
                <span className="sm:text-sm text-xs">Previous</span>
              </Button>

              <span className="text-xs text-gray-500 font-medium">
                {currentStep + 1}/{steps.length}
              </span>

              <Button
                variant={
                  currentStep === steps.length - 1 ? "outline" : "default"
                }
                size="sm"
                onClick={() => {
                  if (currentStep === steps.length - 1) {
                    setIsOpen(false);
                  } else {
                    setCurrentStep((prev) => prev + 1);
                  }
                }}
                className={`h-9 px-4 ${
                  currentStep === steps.length - 1
                    ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                    : "bg-rose-500 hover:bg-rose-600"
                }`}
              >
                <span className="sm:text-sm text-xs">
                  {currentStep === steps.length - 1 ? "Got it!" : "Next"}
                </span>
                {currentStep !== steps.length - 1 && (
                  <ChevronRight className="sm:w-4 sm:h-4 w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
