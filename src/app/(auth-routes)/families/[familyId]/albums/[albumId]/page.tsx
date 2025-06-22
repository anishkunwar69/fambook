"use client";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Media = {
  id: string;
  url: string;
  type: string;
  createdAt: string;
};

type Album = {
  id: string;
  name: string;
  description: string | null;
  mediaLimit: number;
  familyId: string;
  familyName: string;
  media: Media[];
  _count: {
    media: number;
  };
};

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch album data
  const { data: album, isLoading } = useQuery<Album>({
    queryKey: ["album", params.albumId],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${params.albumId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
  });

  // Upload media mutation
  const uploadMedia = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("media", file));

      const res = await fetch(`/api/albums/${params.albumId}/media`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album", params.albumId] });
      toast({
        title: "Success",
        description: "Media uploaded successfully",
        
      });
    },
    onError: (error: Error) => {
      toast({
        description: "Something went wrong!",
        variant: "destructive",
      });
    },
  });

  // Delete media mutation
  const deleteMedia = useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await fetch(`/api/albums/${params.albumId}/media/${mediaId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album", params.albumId] });
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        description: "Something went wrong!",
        variant: "destructive",
      });
    },
  });

  // Handle file drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
      "video/*": [],
    },
    onDrop: async (acceptedFiles) => {
      if (!album) return;

      if (album._count.media + acceptedFiles.length > album.mediaLimit) {
        toast({
          title: "Error",
          description: `Cannot add more files. Album limit is ${album.mediaLimit} items.`,
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        await uploadMedia.mutateAsync(acceptedFiles);
      } finally {
        setIsUploading(false);
      }
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!album) {
    return <div>Album not found</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: "Families", href: "/families" },
          { label: album.familyName, href: `/families/${album.familyId}` },
          { label: "Albums", href: `/families/${album.familyId}/albums` },
          { label: album.name, href: "#" },
        ]}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{album.name}</h1>
            {album.description && (
              <p className="text-muted-foreground mt-2">{album.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {album._count.media} / {album.mediaLimit} items
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById("fileInput")?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          )}
        >
          <input {...getInputProps()} id="fileInput" />
          <p className="text-muted-foreground">
            {isDragActive
              ? "Drop the files here..."
              : "Drag and drop files here, or click to select files"}
          </p>
        </div>

        {/* Media grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.media.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              {item.type.startsWith("image/") ? (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  controls
                />
              )}

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMedia.mutate(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 