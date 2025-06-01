import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  GitFork,
  Info,
  LayoutGrid,
  Plus,
  Users,
  ZoomIn,
  ZoomOut,
  Save,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  {
    title: "Getting Started",
    content: [
      "Welcome to your family tree! Let's learn how to create and organize your family connections.",
      "The workspace shows your family members as cards that you can connect and arrange.",
      "If you're an admin, look for the '+' button to add your first family member.",
      "You can view all family relationships in the tree visualization."
    ],
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: "Admin vs. Regular Users",
    content: [
      "Family trees have two different user roles:",
      "Admins: Can create and edit family members, create relationships, and save positions",
      "Regular users: Can view the family tree and member details, but cannot modify the tree structure",
      "The tree will show relationship lines for all users, but only admins can create new connections",
      "Admin-only features are marked with special indicators throughout this guide"
    ],
    icon: <Shield className="w-6 h-6" />,
  },
  {
    title: "Adding Family Members (Admin Only)",
    content: [
      "Click the '+' icon to add a new family member",
      "Fill in their details in the form:",
      "  Basic info: Name, birth date, gender",
      "  Optional: Profile picture, occupation, places",
      "  Additional: Biography and custom fields",
      "Click 'Save' to add them to your tree",
      "Note: Only family tree admins can add new members"
    ],
    icon: <Plus className="w-6 h-6" />,
  },
  {
    title: "Understanding Connection Points",
    content: [
      "Each member card has two connection points:",
      "  Top dot: Receives connections from parents",
      "  Bottom dot: Creates connections to spouses and children",
      "Note: Connection points are only visible and interactive for admin users",
      "Regular users will see relationship lines but cannot create new connections",
      "To make a connection (admins only), click and drag from one dot to another.",
      "The order of creating relationships is important:",
      "1. Create spouse relationships first",
      "2. Then create parent-child relationships"
    ],
    connectionPoints: [
      {
        type: "Bottom Dot (Admin Only)",
        description: "Connect to spouses and children",
        icon: <ArrowDown className="w-4 h-4" />,
      },
      {
        type: "Top Dot (Admin Only)",
        description: "Receive parent connections",
        icon: <ArrowUp className="w-4 h-4" />,
      },
    ],
    icon: <Info className="w-6 h-6" />,
  },
  {
    title: "Creating Family Relationships (Admin Only)",
    content: ["Follow this specific order to create relationships (admin users only):"],
    relationships: [
      {
        type: "1. Spouse Relationships",
        steps: [
          "Start from either spouse's bottom dot",
          "Drag to the other spouse's bottom dot",
          "Select 'Spouse' in the popup",
          "You can add marriage dates if available"
        ],
        icon: <ArrowLeftRight className="w-4 h-4" />,
      },
      {
        type: "2. Parent-Child Relationships",
        steps: [
          "Start from parent's bottom dot, either father or mother",
          "Drag to child's top dot",
          "Select 'Parent' in the popup",
          "Recommended: Create parent-child relationships from father"
        ],
        icon: <ArrowDown className="w-4 h-4" />,
      },
    ],
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: "Organizing Your Tree",
    content: [
      "View and navigate your family tree:",
      "  Relationship lines connect family members",
      "  All users can see the full tree structure",
      "  Click on any member to view their details",
      "  Use the zoom controls to adjust your view",
      "Admin users can additionally:",
      "  Drag nodes to reposition them manually",
      "  Save positions of nodes after arranging them"
    ],
    
    icon: <LayoutGrid className="w-6 h-6" />,
  },
  {
    title: "Best Practices & Troubleshooting",
    content: [
      "Tips for all users:",
      "  Click any member to view their detailed information",
      "  Use zoom controls to navigate large family trees",
      "  Look for the info (i) icon to understand what tags on member cards mean",
      "For admin users:",
      "  Add all family members before creating connections",
      "  Create spouse relationships first, then parent-child relationships",
      "  Click the edit button (pencil icon) on a member card to edit their details",
      "  Save your layout frequently with 'Save Positions'",
      "  If a connection isn't working, check if you're using the correct dots"
    ],
    icon: <GitFork className="w-6 h-6" />,
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
        className={`bg-white hover:bg-gray-50 text-gray-900 shadow-md gap-2 rounded-full px-4 py-2 border border-gray-200 relative ${
          isPulsing ? "animate-pulse ring-2 ring-rose-300 ring-opacity-75" : ""
        }`}
        onClick={handleOpenGuide}
      >
        <Users className="w-4 h-4 text-rose-500" />
        <span className="font-medium">Family Tree Guide</span>
        {isPulsing && (
          <span className="absolute -right-2 -top-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            !
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white/95 backdrop-blur-sm">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Family Tree Guide
          </DialogTitle>

          <DialogClose className="absolute right-4 top-4 rounded-full h-8 w-8 p-0" />

          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-1 rounded-full mb-6 mt-4">
            <div
              className="bg-rose-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                  {steps[currentStep].icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900">
                  {steps[currentStep].title}
                </h3>
              </div>

              <ul className="space-y-3 mb-4">
                {steps[currentStep].content.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <span className="text-rose-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {steps[currentStep].connectionPoints && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Connection Points:
                  </h4>
                  <div className="grid gap-3">
                    {steps[currentStep].connectionPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100"
                      >
                        <div className="p-2 bg-rose-50 rounded-full text-rose-600">
                          {point.icon}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            {point.type}:
                          </span>
                          <span className="text-gray-600 ml-2">
                            {point.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {steps[currentStep].relationships && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Creating Relationships:
                  </h4>
                  <div className="grid gap-4">
                    {steps[currentStep].relationships.map((rel, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-rose-50 rounded-full text-rose-600">
                            {rel.icon}
                          </div>
                          <span className="font-medium text-gray-900">
                            {rel.type}
                          </span>
                        </div>
                        <ul className="space-y-2 pl-4">
                          {rel.steps.map((step, stepIndex) => (
                            <li
                              key={stepIndex}
                              className="text-gray-600 text-sm"
                            >
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-500">
                {currentStep + 1} of {steps.length}
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
                className="gap-1"
              >
                {currentStep === steps.length - 1 ? (
                  "Got it!"
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
