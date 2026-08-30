"use client";

import { useState } from "react";

export function ThemePreviewImage({
  src,
  alt,
  className = "h-36",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return <div className={`bg-neutral-100 ${className}`} aria-hidden />;
  }

  return (
    <div className={`overflow-hidden bg-neutral-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
