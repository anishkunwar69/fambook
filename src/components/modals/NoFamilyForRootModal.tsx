import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

interface NoFamilyForRootModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFamiliesHaveRoots?: boolean;
}

const NoFamilyForRootModal: React.FC<NoFamilyForRootModalProps> = ({ isOpen, onClose, allFamiliesHaveRoots }) => {
  if (!isOpen) return null;

  const title = allFamiliesHaveRoots ? "All Families Have Trees" : "No Eligible Families Found";
  const description =
    allFamiliesHaveRoots
      ? "All of your current families already have a Family Tree. You can manage existing trees or create a new family to start another tree."
      : "To create a family tree, you need to be a member of a family that doesn't have a tree yet, or create a new family.";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </Button>

        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-100 p-4 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {title}
          </h2>
          <p className="text-gray-600 mb-8 max-w-sm">
            {description}
          </p>
          {!allFamiliesHaveRoots && (
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button
                onClick={onClose} // Keep this to close the modal
                variant="outline"
                className="w-full sm:w-auto"
              >
                Maybe Later
              </Button>
              <Button asChild className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600">
                <Link href="/families/create">
                  Create a Family
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoFamilyForRootModal; 