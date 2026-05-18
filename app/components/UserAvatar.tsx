"use client";

import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  alt?: string | null;
  size?: number;
}

export function UserAvatar({ src, alt, size = 40 }: UserAvatarProps) {
  const [error, setError] = React.useState(false);

  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || "User")}&background=random`;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <Image
        src={error || !src ? fallback : src}
        alt={alt || "User Avatar"}
        fill
        className="object-cover"
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
