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

  const rollEnd = String(events.length).padStart(2, "0");

  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <p className={styles.meta}>COLORSTACK NYC · ROLL 01–{rollEnd}</p>
      </header>

      <div className={styles.shelfWrap}>
        <div className={styles.shelf}>
          {events.map((event) => (
            <RollColumn
              key={event.slug}
              event={event}
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
