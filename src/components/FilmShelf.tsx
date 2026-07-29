"use client";

import { useCallback, useState } from "react";
import type { Event, Photo } from "@/lib/events";
import { events } from "@/lib/events";
import Lightbox from "./Lightbox";
import RollColumn from "./RollColumn";
import styles from "./FilmShelf.module.css";

type ActivePhoto = {
  event: Event;
  photo: Photo;
};

export default function FilmShelf() {
  const [active, setActive] = useState<ActivePhoto | null>(null);

  const onPhotoClick = useCallback((event: Event, photo: Photo) => {
    setActive({ event, photo });
  }, []);

  const onClose = useCallback(() => setActive(null), []);

  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <p className={styles.meta}>I&apos;m a designer who loves hosting things</p>
      </header>

      <div className={styles.shelfWrap}>
        <div className={styles.shelf}>
          {events.map((event, index) => (
            <RollColumn
              key={event.slug}
              event={event}
              index={index}
              autoScrollPaused={active !== null}
              onPhotoClick={onPhotoClick}
            />
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Tise · ColorStack NYC</p>
        <p className={styles.footerLabel}>FILM ROLLS · COMMUNITY ARCHIVE</p>
      </footer>

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
