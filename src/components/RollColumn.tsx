"use client";

import type { Event, Photo } from "@/lib/events";
import styles from "./RollColumn.module.css";

type RollColumnProps = {
  event: Event;
  onPhotoClick: (event: Event, photo: Photo) => void;
};

export default function RollColumn({ event, onPhotoClick }: RollColumnProps) {
  return (
    <article className={styles.column}>
      <header className={styles.header}>
        <p className={styles.date}>{event.date}</p>
        <h2 className={styles.title}>{event.title}</h2>
      </header>
      <div className={styles.scroll}>
        {event.photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className={styles.frame}
            onClick={() => onPhotoClick(event, photo)}
            aria-label={`Open ${photo.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              width={400}
              height={520}
              loading="lazy"
              className={styles.photo}
            />
            <span className={styles.frameNumber}>{photo.frame}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
