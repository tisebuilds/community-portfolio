"use client";

import { useCallback, useState } from "react";
import type { Event, Photo } from "@/lib/events";
import { events } from "@/lib/events";
import Lightbox from "./Lightbox";
import styles from "./FilmShelf.module.css";

type ActivePhoto = {
  event: Event;
  photo: Photo;
};

function ExternalLinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 4h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14 20 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FilmShelf() {
  const [active, setActive] = useState<ActivePhoto | null>(null);

  const onPhotoClick = useCallback((event: Event, photo: Photo) => {
    setActive({ event, photo });
  }, []);

  const onClose = useCallback(() => setActive(null), []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.handle}>I&apos;m A Designer Who Loves Hosting Things</p>
        </div>
      </header>

      <main className={styles.feed}>
        {events.map((event) => (
          <section key={event.slug} className={styles.week} aria-label={event.title}>
            <div className={styles.weekHeader}>
              <div className={styles.weekTitleRow}>
                <h2 className={styles.weekLabel}>{event.title}</h2>
                <p className={styles.weekRange}>{event.date}</p>
                {event.partifulUrl ? (
                  <a
                    className={styles.externalLink}
                    href={event.partifulUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${event.title} on Partiful`}
                  >
                    <ExternalLinkIcon />
                  </a>
                ) : (
                  <span className={styles.externalLink} aria-hidden="true">
                    <ExternalLinkIcon />
                  </span>
                )}
              </div>
            </div>

            <div className={styles.photoRow}>
              <div className={styles.filmStrip}>
                <div className={styles.sprocketRail} aria-hidden="true" />
                <div className={styles.frames}>
                  {event.photos.map((photo) => (
                    <div key={photo.id} className={styles.frame}>
                      <span className={styles.frameEdge} aria-hidden="true">
                        {photo.frame}
                      </span>
                      <button
                        type="button"
                        className={styles.photoBtn}
                        style={{ aspectRatio: photo.aspect }}
                        onClick={() => onPhotoClick(event, photo)}
                        aria-label={`Open ${photo.alt}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          width={photo.width}
                          height={photo.height}
                          loading="lazy"
                          className={styles.photo}
                        />
                      </button>
                      <span className={styles.frameBarcode} aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className={styles.sprocketRail} aria-hidden="true" />
              </div>
            </div>
          </section>
        ))}
      </main>

      {active ? (
        <Lightbox
          event={active.event}
          photo={active.photo}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}
