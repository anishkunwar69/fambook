import { memo } from "react";
import { EdgeLabelRenderer, EdgeProps, getBezierPath } from "reactflow";

export const RelationshipEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const getRelationshipLabel = () => {
      switch (data?.type) {
        case "PARENT":
          return "child"; // More intuitive - shows what the relationship represents
        case "SPOUSE":
          return "spouse";
        case "SIBLING":
          return "sibling";
        default:
          return "";
      }
    };

    const getRelationshipColor = () => {
      switch (data?.type) {
        case "PARENT":
          return "#2563eb"; // blue-600
        case "SPOUSE":
          return "#e11d48"; // rose-600
        case "SIBLING":
          return "#059669"; // emerald-600
        default:
          return "#6b7280"; // gray-500
      }
    };

    return (
      <>
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          strokeWidth={2}
          stroke={getRelationshipColor()}
          strokeDasharray={data?.isActive ? undefined : "5,5"}
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                selected ? "bg-white shadow-sm" : "bg-white/80"
              }`}
              style={{ color: getRelationshipColor() }}
            >
              {getRelationshipLabel()}
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

RelationshipEdge.displayName = "RelationshipEdge";
