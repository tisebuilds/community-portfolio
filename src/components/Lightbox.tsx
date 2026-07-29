"use client";

import { useEffect } from "react";
import type { Event, Photo } from "@/lib/events";
import styles from "./Lightbox.module.css";

type LightboxProps = {
  event: Event;
  photo: Photo;
  onClose: () => void;
};

export default function Lightbox({ event, photo, onClose }: LightboxProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className={styles.scrim}
      role="dialog"
      aria-modal="true"
      aria-label={`${event.title}, frame ${photo.frame}`}
      onClick={onClose}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <figure
        className={styles.figure}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt}
          className={styles.image}
        />
        <figcaption className={styles.caption}>
          {event.title} · {event.date}
        </figcaption>
      </figure>
    </div>
  );
}
