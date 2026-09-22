import { getPublicGallery } from "@/features/public-gallery/public-gallery-service";
import type { PublicGalleryRecord } from "@/features/public-gallery/public-gallery.types";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function usePublicGallery() {
    const { token } = useParams<{ token: string }>();
  const [gallery, setGallery] = useState<PublicGalleryRecord | null>(null);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);
  const validToken = token && /^[A-Za-z0-9]{64}$/.test(token) ? token : null;

  useEffect(() => {
    if (!validToken) return;
    const controller = new AbortController();
    getPublicGallery(validToken, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setGallery(result);
          setState("success");
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setGallery(null);
        setError(
          caught instanceof ApiError && caught.status === 410
            ? "Link gallery sudah kedaluwarsa."
            : caught instanceof ApiError && caught.status === 404
              ? "Gallery tidak ditemukan atau belum selesai."
              : caught instanceof ApiError
                ? caught.message
                : "Tidak dapat terhubung ke server.",
        );
        setState("error");
      });
    return () => controller.abort();
  }, [requestKey, validToken]);

  function retry(): void {
    setGallery(null);
    setError("");
    setState("loading");
    setRequestKey((value) => value + 1);
  }

  return {
    gallery, state, error, retry , validToken
  }

}