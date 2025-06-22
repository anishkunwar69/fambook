"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  Node,
  NodeChange,
  Panel,
  ReactFlowInstance,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom node types
import { AddMemberNode } from "@/components/roots/AddMemberNode";
import { FamilyMemberNode } from "@/components/roots/FamilyMemberNode";
import { FamilyTreeGuide } from "@/components/roots/FamilyTreeGuide";
import { FamilyTreeInfo } from "@/components/roots/FamilyTreeInfo";
import { MemberDetailsDialog } from "@/components/roots/MemberDetailsDialog";
import { RelationshipDialog } from "@/components/roots/RelationshipDialog";
import { RelationshipEdge } from "@/components/roots/RelationshipEdge";
import { useQueryClient } from "@tanstack/react-query";
import dagre from "dagre";
import { DeleteMemberNodeModal } from "@/components/roots/DeleteMemberNodeModal";

const nodeTypes = {
  familyMember: FamilyMemberNode,
  addMember: AddMemberNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

type RootDetails = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    imageUrl: string | null;
  };
  nodes: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    dateOfDeath: string | null;
    gender: "MALE" | "FEMALE" | "OTHER";
    isAlive: boolean;
    profileImage: string | null;
    occupation: string | null;
    birthPlace: string | null;
    currentPlace: string | null;
    biography: string | null;
    customFields: Record<string, any> | null;
    positionX: number | null;
    positionY: number | null;
    onClick?: () => void;
  }>;
  relations: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    relationType: "PARENT" | "SPOUSE";
    marriageDate: string | null;
    divorceDate: string | null;
    isActive: boolean;
  }>;
  isAdmin?: boolean;
};

type DialogState = {
  type: "member" | "relationship";
  mode: "add" | "edit";
  data?: any;
  sourceNode?: any;
  targetNode?: any;
} | null;



export default function RootEditorPage() {
  const params = useParams();
  const familyId = params.familyId as string;
  const rootId = params.rootId as string;
  const router = useRouter();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [hasPositionChanges, setHasPositionChanges] = useState(false);
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<{
    id: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // Add ref for ReactFlow wrapper
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Fetch root details
  const { data: root, isLoading } = useQuery<RootDetails>({
    queryKey: ["root", rootId],
    queryFn: async () => {
      const response = await fetch(`/api/families/${familyId}/roots/${rootId}`);
      const result = await response.json();
      console.log("result", result);
      if (!result.success) {
        throw new Error("Something went wrong!");
      }
      return result.data;
    },
  });

  // Add mutation for deleting nodes
  const deleteMemberNodeMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const response = await fetch(
        `/api/families/${familyId}/roots/${rootId}/nodes/${nodeId}`,
        {
          method: "DELETE",
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error("Failed to delete member node");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Family member deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["root", rootId] });
      setNodeToDelete(null);
      
      // Remove the node from the nodes state
      if (nodeToDelete) {
        setNodes((nds) => nds.filter((node) => node.id !== nodeToDelete.id));
      }
    },
    onError: (err: Error) => {
      toast.error("Could not delete family member");
    },
  });

  // Update isAdmin state when root data is fetched
  useEffect(() => {
    if (root?.isAdmin !== undefined) {
      setIsAdmin(root.isAdmin);
    }
  }, [root]);

  // Initialize flow with root data
  useEffect(() => {
    if (root) {
      console.log("Root data:", root);

      // Transform nodes data
      const nodesData: Node[] = root.nodes.map((node) => {
        // Check if the node has any relationships
        const hasRelationships = root.relations.some(
          (relation) => 
            relation.fromNodeId === node.id || 
            relation.toNodeId === node.id
        );
        
        const canDelete = !hasRelationships;
        
        return {
          id: node.id,
          type: "familyMember",
          position: {
            x: typeof node.positionX === "number" ? node.positionX : 0,
            y: typeof node.positionY === "number" ? node.positionY : 0,
          },
          data: {
            ...node,
            familyId,
            isAdmin: root.isAdmin,
            canDelete,
            onEdit: () => {
              setDialogState({
                type: "member",
                mode: "edit",
                data: { nodeId: node.id },
              });
            },
            onDelete: () => handleDeleteNode(node.id),
          },
        };
      });

      // Add "Add Member" node at a better initial position only for admins
      if (root.isAdmin) {
        nodesData.push({
          id: "add-member",
          type: "addMember",
          position: { x: 0, y: 0 },
          data: {
            id: "add-member",
            firstName: "",
            lastName: "",
            fullName: "Add Member",
            familyId: familyId, // Add familyId to add member node data
            dateOfBirth: null,
            dateOfDeath: null,
            gender: "OTHER" as const,
            isAlive: true,
            profileImage: null,
            occupation: null,
            birthPlace: "",
            currentPlace: "",
            biography: null,
            customFields: {},
            positionX: 0,
            positionY: 0,
            isAdmin: root.isAdmin, // Add isAdmin flag to fix linter error
            onEdit: () => {}, // Empty function to satisfy type requirements
            onClick: () => {
              setDialogState({
                type: "member",
                mode: "add",
                data: { position: { x: 0, y: 0 } },
              });
            },
          },
        });
      }

      // Transform relations to edges
      const flowEdges: Edge[] = root.relations.map((relation) => ({
        id: relation.id,
        source: relation.fromNodeId,
        target: relation.toNodeId,
        type: "relationship",
        data: {
          // Keep the original relationship type for proper handling
          type: relation.relationType,
          marriageDate: relation.marriageDate,
          divorceDate: relation.divorceDate,
          isActive: relation.isActive,
        },
      }));

      // Check if we have saved positions
      const hasPositions = root.nodes.some(
        (node) =>
          typeof node.positionX === "number" &&
          typeof node.positionY === "number"
      );

      if (!hasPositions) {
        // Apply automatic layout for initial setup
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(nodesData, flowEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } else {
        // Use saved positions and set hasPositionChanges to true
        setNodes(nodesData);
        setEdges(flowEdges);
        setHasPositionChanges(true);
      }

      // Always fit view on initial load with a delay to ensure rendering
      setTimeout(() => {
        fitView({
          padding: 0.5,
          duration: 200,
          minZoom: 0.5,
          maxZoom: 1,
        });
      }, 100);
    }
  }, [root, setNodes, setEdges, fitView]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (node.type === "addMember") {
      setIsAddingMember(true);
    } else {
      setIsEditingMember(true);
    }
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  // Save changes mutation
  const { mutate: saveChanges, isPending: isSaving } = useMutation({
    mutationFn: async (data: { nodes: any[]; relations: any[] }) => {
      toast.loading("Saving changes...", { id: "saving-changes" });
      const response = await fetch(
        `/api/families/${familyId}/roots/${rootId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      console.log("result", result);
      if (!result.success) throw new Error("Something went wrong!");
      return result.data;
    },
    onSuccess: () => {
      toast.success("Changes saved successfully!", { id: "saving-changes" });
      // Invalidate and refetch root data
      queryClient.invalidateQueries({ queryKey: ["root", rootId] });
    },
    onError: (error) => {
      console.log(error.message);
      toast.error("Something went wrong!");
    },
  });

  // Add automatic layout function
  const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    // Change rankdir to TB (top to bottom) and increase spacing
    dagreGraph.setGraph({
      rankdir: "TB",
      nodesep: 200, // Increase horizontal spacing between nodes
      ranksep: 150, // Increase vertical spacing between ranks
      align: "UL", // Align nodes to upper left
      marginx: 50, // Add margin on x-axis
      marginy: 50, // Add margin on y-axis
    });

    // Add nodes to dagre graph
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 200, height: 100 });
    });

    // Add edges to dagre graph with specific handling for different relationship types
    edges.forEach((edge) => {
      if (edge.data?.type === "SPOUSE") {
        // For spouse relationships, try to keep nodes at same level
        dagreGraph.setEdge(edge.source, edge.target, { minlen: 2, weight: 2 });
      } else if (edge.data?.type === "PARENT") {
        // For parent relationships, ensure clear hierarchy
        dagreGraph.setEdge(edge.source, edge.target, { minlen: 1, weight: 1 });
      }
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Get new node positions
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 100,
          y: nodeWithPosition.y - 50,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  // Handle nodes change with position tracking
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      // Set hasPositionChanges to true for any position change
      if (changes.some((change) => change.type === "position")) {
        setHasPositionChanges(true);
      }
    },
    [setNodes]
  );

  // Handle save
  const handleSave = () => {
    const data = {
      nodes: nodes
        .filter((n) => n.type === "familyMember")
        .map((n) => {
          return {
            id: n.id,
            rootId,
            firstName: n.data.firstName,
            lastName: n.data.lastName,
            dateOfBirth: n.data.dateOfBirth || null,
            dateOfDeath: n.data.dateOfDeath || null,
            gender: n.data.gender,
            isAlive: n.data.isAlive,
            profileImage: n.data.profileImage || null,
            occupation: n.data.occupation || null,
            birthPlace: n.data.birthPlace || null,
            currentPlace: n.data.currentPlace || null,
            biography: n.data.biography || null,
            customFields: n.data.customFields || {},
            // Save exact positions without any adjustments
            positionX: Math.round(n.position.x),
            positionY: Math.round(n.position.y),
          };
        }),
      relations: edges.map((e) => ({
        id: e.id,
        fromNodeId: e.source,
        toNodeId: e.target,
        relationType: e.data?.type,
        marriageDate: e.data?.marriageDate || null,
        divorceDate: e.data?.divorceDate || null,
        isActive: e.data?.isActive ?? true,
      })),
    };

    console.log("Saving data:", data);
    saveChanges(data);
  };

  // Handle node selection
  const onSelectionChange = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodes(params.nodes);
    },
    []
  );

  // Handle node addition
  const onAddNode = useCallback((position: { x: number; y: number }) => {
    setDialogState({
      type: "member",
      mode: "add",
      data: { position },
    });
  }, []);

  // Handle node edit
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type !== "familyMember") {
        // Only handle non-familyMember nodes here since familyMember nodes use the edit button
        setDialogState({
          type: "member",
          mode: "edit",
          data: node.data,
        });
      }
    },
    []
  );

  // Handle edge creation
  const onConnect = useCallback(
    (params: Connection) => {
      setDialogState({
        type: "relationship",
        mode: "add",
        sourceNode: nodes.find((n) => n.id === params.source),
        targetNode: nodes.find((n) => n.id === params.target),
      });
    },
    [nodes]
  );

  // Handle member save
  const handleMemberSave = async (data: any) => {
    const isEdit = dialogState?.mode === "edit";
    try {
      toast.loading("Saving member...", { id: "save-member" });
      console.log("[DEBUG] Saving member with data:", data);
      const nodeId = isEdit ? dialogState?.data?.id : `node-${Date.now()}`;

      // Create node data matching exactly with the Prisma RootNode model structure
      const newNodeData = {
        id: nodeId,
        rootId: rootId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth.toISOString(),
        dateOfDeath: data.dateOfDeath ? data.dateOfDeath.toISOString() : null,
        gender: data.gender,
        isAlive: data.isAlive ?? true,
        profileImage: data.profileImage || null,
        birthPlace: data.birthPlace || "",
        currentPlace: data.currentPlace || "",
        biography: data.biography || null,
        customFields: data.customFields || {},
        userId: null,
        linkedMemberId: data.linkedMemberId || null,
      };

      console.log("[DEBUG] Created node data:", newNodeData);

      // Close the dialog first
      setDialogState(null);

      // Prepare save data with only the nodes being modified
      const saveData = {
        nodes: [newNodeData],
        relations: edges.map((e) => ({
          id: e.id,
          fromNodeId: e.source,
          toNodeId: e.target,
          relationType: e.data?.type,
          marriageDate: e.data?.marriageDate || null,
          divorceDate: e.data?.divorceDate || null,
          isActive: e.data?.isActive ?? true,
        })),
      };

      console.log("[DEBUG] Final save data:", saveData);

      // Save the changes
      const response = await fetch(
        `/api/families/${familyId}/roots/${rootId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saveData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[DEBUG] Save failed:", error);
        throw new Error(error.message || "Failed to save changes");
      }

      const result = await response.json();
      console.log("[DEBUG] Save successful:", result);

      // Show success message
      toast.success("Member saved successfully!", { id: "save-member" });

      // Invalidate and refetch root data and unlinked members
      queryClient.invalidateQueries({ queryKey: ["root", rootId] });
      queryClient.invalidateQueries({
        queryKey: ["unlinked-members", familyId],
      });
    } catch (error) {
      console.error("Failed to save member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save member",
        { id: "save-member" }
      );
      setDialogState({
        type: "member",
        mode: isEdit ? "edit" : "add",
        data: { ...data, position: dialogState?.data?.position },
      });
    }
  };

  // Add this function in RootEditorPage component
  const validateRelationship = (
    sourceId: string,
    targetId: string,
    relationType: string
  ): string | null => {
    // Get source and target nodes
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);

    if (!sourceNode || !targetNode) {
      return "Invalid nodes selected";
    }

    // Get all existing relationships
    const getNodeRelations = (nodeId: string) => {
      return edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
    };

    // Get parent relationships for a node
    const getParents = (nodeId: string) => {
      return edges.filter(
        (edge) => edge.target === nodeId && edge.data?.type === "PARENT"
      );
    };

    // Get children relationships for a node
    const getChildren = (nodeId: string) => {
      return edges.filter(
        (edge) => edge.source === nodeId && edge.data?.type === "PARENT"
      );
    };

    // Get spouse relationships for a node
    const getSpouses = (nodeId: string) => {
      return edges.filter(
        (edge) =>
          (edge.source === nodeId || edge.target === nodeId) &&
          edge.data?.type === "SPOUSE" &&
          edge.data?.isActive === true
      );
    };

    // Basic validation: Can't create relationship with self
    if (sourceId === targetId) {
      return "Cannot create a relationship with self";
    }

    // Check for existing direct relationship
    const existingRelation = edges.find(
      (edge) =>
        (edge.source === sourceId && edge.target === targetId) ||
        (edge.source === targetId && edge.target === sourceId)
    );

    if (existingRelation) {
      return "Relationship already exists between these members";
    }

    // Get birth dates
    const sourceBirth = sourceNode.data.dateOfBirth
      ? new Date(sourceNode.data.dateOfBirth)
      : null;
    const targetBirth = targetNode.data.dateOfBirth
      ? new Date(targetNode.data.dateOfBirth)
      : null;

    // Validate based on relationship type
    switch (relationType) {
      case "PARENT": {
        // 1. Parent must be older than child
        if (sourceBirth && targetBirth && sourceBirth >= targetBirth) {
          return "Parent must be born before child";
        }

        // 2. Age difference should be reasonable (at least 12 years)
        if (sourceBirth && targetBirth) {
          const ageDiff =
            (targetBirth.getTime() - sourceBirth.getTime()) /
            (1000 * 60 * 60 * 24 * 365);
          if (ageDiff < 12) {
            return "Parent must be at least 12 years older than child";
          }
        }

        // 3. Child can't have more than two parents
        const existingParents = getParents(targetId);
        if (existingParents.length >= 2) {
          return "A person cannot have more than two parents";
        }

        // 4. Check for circular relationships (parent can't be child's descendant)
        const targetChildren = getChildren(targetId);
        if (targetChildren.some((rel) => rel.target === sourceId)) {
          return "Cannot create circular parent-child relationship";
        }

        break;
      }

      case "SPOUSE": {
        // 1. Both must be of minimum age (at least 16)
        if (sourceBirth && targetBirth) {
          const sourceAge =
            (new Date().getTime() - sourceBirth.getTime()) /
            (1000 * 60 * 60 * 24 * 365);
          const targetAge =
            (new Date().getTime() - targetBirth.getTime()) /
            (1000 * 60 * 60 * 24 * 365);

          if (sourceAge < 16 || targetAge < 16) {
            return "Both members must be at least 16 years old for marriage";
          }
        }

        // 2. Cannot marry if already has an active spouse
        const sourceSpouses = getSpouses(sourceId);
        const targetSpouses = getSpouses(targetId);

        if (sourceSpouses.length > 0) {
          return `${sourceNode.data.firstName} already has an active marriage`;
        }
        if (targetSpouses.length > 0) {
          return `${targetNode.data.firstName} already has an active marriage`;
        }

        // 3. Cannot marry direct relatives
        const sourceParents = getParents(sourceId).map((e) => e.source);
        const targetParents = getParents(targetId).map((e) => e.source);
        const sourceChildren = getChildren(sourceId).map((e) => e.target);
        const targetChildren = getChildren(targetId).map((e) => e.target);

        if (
          sourceParents.includes(targetId) ||
          targetParents.includes(sourceId) ||
          sourceChildren.includes(targetId) ||
          targetChildren.includes(sourceId)
        ) {
          return "Cannot create marriage relationship between direct relatives";
        }

        break;
      }

      default:
        return "Invalid relationship type";
    }

    return null;
  };

  // Update the handleRelationshipSave function
  const handleRelationshipSave = async (data: any) => {
    try {
      const { sourceNode, targetNode } = dialogState!;

      // Run relationship validation first
      const validationError = validateRelationship(
        sourceNode.id,
        targetNode.id,
        data.relationType
      );

      // If validation fails, show error and return early
      if (validationError) {
        toast.error("Validation failed!");
        return;
      }

      const edgeId = `edge-${Date.now()}`;

      // Create the new edge with consistent data structure
      const newEdge: Edge = {
        id: edgeId,
        source: sourceNode.id,
        target: targetNode.id,
        type: "relationship",
        data: {
          // Keep the original relationship type for proper handling
          type: data.relationType,
          marriageDate: data.marriageDate,
          divorceDate: data.divorceDate,
          isActive: data.isActive ?? true,
        },
      };

      // Close the dialog first
      setDialogState(null);

      // Get current node positions and ensure all required fields are included
      const currentNodes = nodes
        .filter((n) => n.type === "familyMember")
        .map((n) => ({
          id: n.id,
          rootId,
          firstName: n.data.firstName,
          lastName: n.data.lastName,
          dateOfBirth: n.data.dateOfBirth,
          dateOfDeath: n.data.dateOfDeath,
          gender: n.data.gender,
          isAlive: n.data.isAlive,
          profileImage: n.data.profileImage || null,
          birthPlace: n.data.birthPlace || "",
          currentPlace: n.data.currentPlace || "",
          biography: n.data.biography || null,
          customFields: n.data.customFields || {},
          positionX: Math.round(n.position.x),
          positionY: Math.round(n.position.y),
        }));

      // Prepare the save data
      const saveData = {
        nodes: currentNodes,
        relations: [...edges, newEdge].map((e) => ({
          id: e.id,
          fromNodeId: e.source,
          toNodeId: e.target,
          relationType: e.data?.type,
          marriageDate: e.data?.marriageDate || null,
          divorceDate: e.data?.divorceDate || null,
          isActive: e.data?.isActive ?? true,
        })),
      };

      console.log("[DEBUG] Saving relationship data:", saveData);
      console.log("[DEBUG] New edge data:", newEdge);
      console.log("[DEBUG] Original form data:", data);
      console.log(
        "[DEBUG] All relations being saved:",
        saveData.relations.map((r) => ({
          id: r.id,
          relationType: r.relationType,
          fromNodeId: r.fromNodeId,
          toNodeId: r.toNodeId,
        }))
      );

      // Create a promise that resolves when the mutation is complete
      await new Promise((resolve, reject) => {
        saveChanges(saveData, {
          onSuccess: () => {
            // Only update local state after successful save
            setEdges((eds) => [...eds, newEdge]);
            toast.success("Relationship saved successfully");
            resolve(undefined);
          },
          onError: (error) => {
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error("Failed to save relationship:", error);
      toast.error("Failed to save relationship");
      // Reopen the dialog with the previous data if save fails
      setDialogState({
        type: "relationship",
        mode: "add",
        sourceNode: dialogState?.sourceNode,
        targetNode: dialogState?.targetNode,
      });
    }
  };

  // Add drag and drop functionality
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const position = reactFlowInstance?.project({
        x: event.clientX - (reactFlowBounds?.left ?? 0),
        y: event.clientY - (reactFlowBounds?.top ?? 0),
      });

      if (position) {
        onAddNode(position);
      }
    },
    [onAddNode, reactFlowInstance]
  );

  // Add this function to check if a node can be deleted and open the delete modal
  const handleDeleteNode = async (nodeId: string) => {
    try {
      // Find the node in the nodes state
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      
      if (!nodeToDelete) {
        toast.error("Node not found");
        return;
      }
      
      // Check if the node has any relationships
      const hasRelationships = edges.some(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );
      
      if (hasRelationships) {
        toast.error("Cannot delete a node with existing relationships. Remove all relationships first.");
        return;
      }
      
      // Set the node to delete
      setNodeToDelete({
        id: nodeId,
        firstName: nodeToDelete.data.firstName,
        lastName: nodeToDelete.data.lastName,
      });
    } catch (error) {
      toast.error("Failed to check if node can be deleted");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative max-lg:pb-20" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={isAdmin ? onConnect : undefined}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onInit={setReactFlowInstance}
        onNodeDoubleClick={onNodeDoubleClick}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.2}
        maxZoom={1.5}
        snapToGrid={false}
        snapGrid={[1, 1]}
        fitView
        fitViewOptions={{
          padding: 0.5,
          minZoom: 0.5,
          maxZoom: 1,
        }}
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="flex flex-col gap-2">
          <div className="flex items-center gap-2"></div>

          {hasPositionChanges && isAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-rose-500 hover:bg-rose-600 max-sm:mt-1 sm:text-sm text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="sm:w-4 sm:h-4 w-3 h-3 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Positions"
              )}
            </Button>
          )}

          <FamilyTreeGuide />
        </Panel>
      </ReactFlow>

      <FamilyTreeInfo />

      {/* Dialogs */}
      <MemberDetailsDialog
        isOpen={dialogState?.type === "member"}
        onClose={() => setDialogState(null)}
        onSubmit={handleMemberSave}
        initialData={dialogState?.data}
        mode={dialogState?.mode || "add"}
        familyId={familyId}
        isAdmin={isAdmin}
      />

      {dialogState?.type === "relationship" && (
        <RelationshipDialog
          isOpen={true}
          onClose={() => setDialogState(null)}
          onSubmit={handleRelationshipSave}
          sourceNode={dialogState.sourceNode}
          targetNode={dialogState.targetNode}
          validateRelationship={validateRelationship}
          isAdmin={isAdmin}
        />
      )}

      <DeleteMemberNodeModal
        isOpen={!!nodeToDelete}
        onClose={() => setNodeToDelete(null)}
        memberToDelete={nodeToDelete}
        onConfirmDelete={(nodeId) => deleteMemberNodeMutation.mutate(nodeId)}
        isDeleting={deleteMemberNodeMutation.isPending}
      />
    </div>
  );
}
