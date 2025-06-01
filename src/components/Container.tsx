import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full h-full",
        "px-4 sm:px-6 md:px-8 lg:px-12",
        "max-w-[500px] sm:max-w-[600px] md:max-w-[720px] lg:max-w-[1140px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Container;
