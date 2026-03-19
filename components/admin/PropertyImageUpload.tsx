"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getSupabase } from "@/lib/supabase/client";
import { renderImageUrl } from "@/lib/storage/imageUrl";
import { logActivity } from "@/lib/admin/logActivity";

type UploadedImage = {
  path: string; // storage path OR existing gallery URL (renderImageUrl can extract path from it)
  url: string;  // 300w admin preview URL
};

type ChangePayload = { coverUrl: string; galleryUrls: string[] };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  propertyCode: string;
  propertyId?: string;  // available in edit mode only; logging is skipped if absent
  initialCoverUrl?: string | null;
  initialGalleryUrls?: string[];
  onChange: (data: ChangePayload) => void;
};

/** Convert existing gallery URLs (from DB) into UploadedImage entries for the preview grid. */
function urlsToImages(urls: string[]): UploadedImage[] {
  return urls.map((url) => ({
    path: url,
    url: renderImageUrl(url, "admin") ?? url,
  }));
}

// ── Sortable image tile ────────────────────────────────────────────────────────

type SortableImageProps = {
  image: UploadedImage;
  index: number;
  onSetCover: () => void;
  onRemove: () => void;
};

function SortableImage({ image, index, onSetCover, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden aspect-square bg-[#F4F4F4] touch-none"
    >
      {/* Drag handle — entire image is draggable */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={`Photo ${index + 1}`}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* Cover badge / Set cover button */}
      {index === 0 ? (
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-[#1E1E1E] text-white px-1.5 py-0.5 rounded pointer-events-none">
          Cover
        </span>
      ) : (
        <button
          type="button"
          onClick={onSetCover}
          className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded hover:bg-[#1E1E1E] transition-colors"
          aria-label="Set as cover"
        >
          Set cover
        </button>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        ×
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PropertyImageUpload({
  propertyCode,
  propertyId,
  initialCoverUrl,
  initialGalleryUrls = [],
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<UploadedImage[]>(() =>
    initialGalleryUrls.length > 0
      ? urlsToImages(initialGalleryUrls)
      : initialCoverUrl
        ? urlsToImages([initialCoverUrl])
        : []
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropZoneDragging, setDropZoneDragging] = useState(false);

  // dnd-kit requires a minimum pointer movement before activating drag,
  // so that click handlers on buttons inside sortable items still fire normally.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function notifyParent(next: UploadedImage[]) {
    const galleryUrls = next.map((img) => renderImageUrl(img.path, "gallery") ?? img.url);
    onChange({ coverUrl: galleryUrls[0] ?? "", galleryUrls });
  }

  // ── Drag-and-drop reorder ──────────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((prev) => {
      const oldIndex = prev.findIndex((img) => img.path === active.id);
      const newIndex = prev.findIndex((img) => img.path === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      notifyParent(next);
      return next;
    });
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function uploadFiles(files: FileList | File[]) {
    const all = Array.from(files);
    const rejected = all.filter((f) => !ALLOWED_TYPES.includes(f.type));
    const list = all.filter((f) => ALLOWED_TYPES.includes(f.type));

    if (rejected.length > 0) {
      setError(
        `Unsupported format${rejected.length > 1 ? "s" : ""}: ${rejected.map((f) => f.name).join(", ")}. Use JPG, PNG, or WebP.`
      );
    }

    if (list.length === 0) return;

    setUploading(true);
    setError(null);

    const supabase = getSupabase();
    const uploaded: UploadedImage[] = [];

    for (const file of list) {
      const safeName = file.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9._-]/g, "");
      const path = `properties/${propertyCode}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      uploaded.push({ path, url: renderImageUrl(path, "admin") ?? path });
      if (propertyId) {
        logActivity(propertyId, "property_image_uploaded", { path, property_code: propertyCode });
      }
    }

    setImages((prev) => {
      const next = [...prev, ...uploaded];
      notifyParent(next);
      return next;
    });

    setUploading(false);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
  }

  function handleDropZoneDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropZoneDragging(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  function handleDropZoneDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropZoneDragging(true);
  }

  function handleDropZoneDragLeave() {
    setDropZoneDragging(false);
  }

  // ── Cover / remove ─────────────────────────────────────────────────────────

  function setCover(index: number) {
    if (index === 0) return;
    const coverPath = images[index]?.path;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      notifyParent(next);
      return next;
    });
    if (coverPath && propertyId) {
      logActivity(propertyId, "property_cover_changed", { path: coverPath, property_code: propertyCode });
    }
  }

  function removeImage(index: number) {
    const removedPath = images[index]?.path;
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      notifyParent(next);
      return next;
    });
    if (removedPath && propertyId) {
      logActivity(propertyId, "property_image_removed", { path: removedPath, property_code: propertyCode });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone for file uploads */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDropZoneDrop}
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDropZoneDragLeave}
        className={`relative border-2 border-dashed rounded-lg px-6 py-10 text-center cursor-pointer transition-colors
          ${dropZoneDragging ? "border-[#1E1E1E] bg-[#F0F0F0]" : "border-[#D9D9D9] bg-white hover:border-[#AAAAAA]"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        {uploading ? (
          <p className="text-sm text-[#888888]">Uploading…</p>
        ) : (
          <>
            <p className="text-sm text-[#555555] font-medium">
              Drag images here or click to upload
            </p>
            <p className="text-xs text-[#AAAAAA] mt-1">
              JPG, PNG, WebP — multiple allowed
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Sortable gallery grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.path)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <SortableImage
                  key={img.path}
                  image={img}
                  index={i}
                  onSetCover={() => setCover(i)}
                  onRemove={() => removeImage(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <p className="text-xs text-[#AAAAAA]">
          {images.length} photo{images.length !== 1 ? "s" : ""} — drag to reorder · first image is the cover
        </p>
      )}
    </div>
  );
}
