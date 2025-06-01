import { memo } from "react";
import { Plus } from "lucide-react";

type AddMemberNodeProps = {
  data: {
    onClick?: () => void;
  };
};

export const AddMemberNode = memo(({ data }: AddMemberNodeProps) => {
  return (
    <div 
      className="group cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (data.onClick) {
          data.onClick();
        }
      }}
    >
      <div className="relative bg-white/80 backdrop-blur-md rounded-lg border-2 border-dashed border-gray-200 p-4 w-[120px] flex items-center justify-center group-hover:border-rose-300 transition-colors">
        <Plus className="w-6 h-6 text-gray-400 group-hover:text-rose-500 transition-colors" />
      </div>
    </div>
  );
});

AddMemberNode.displayName = "AddMemberNode";