import type { PublicGalleryMedia } from "@/features/public-gallery/public-gallery.types";
import { FileImage, FileVideo } from "lucide-react";
import type { ReactElement } from "react";

export function mediaIcon(media: PublicGalleryMedia): ReactElement {
  return media.mime_type.startsWith("video/") ? (
    <FileVideo className="size-8" aria-hidden="true" />
  ) : (
    <FileImage className="size-8" aria-hidden="true" />
  );
}