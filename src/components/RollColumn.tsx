"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Event, Photo } from "@/lib/events";
import styles from "./RollColumn.module.css";

type RollColumnProps = {
  event: Event;
  onPhotoClick: (event: Event, photo: Photo) => void;
  /** Pause while lightbox (or other overlay) is open */
  autoScrollPaused?: boolean;
  /** Column index — used to stagger direction/speed */
  index?: number;
};

const BASE_SPEED = 0.35; // px per frame at 60fps ≈ 21px/s
const RESUME_DELAY_MS = 1800;

export default function RollColumn({
  event,
  onPhotoClick,
  autoScrollPaused = false,
  index = 0,
}: RollColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const lightboxPausedRef = useRef(autoScrollPaused);
  const directionRef = useRef(index % 2 === 0 ? 1 : -1);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speed = BASE_SPEED * (0.85 + (index % 3) * 0.15);

  useEffect(() => {
    lightboxPausedRef.current = autoScrollPaused;
  }, [autoScrollPaused]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    // Stagger starting positions so columns aren't locked in sync
    const maxStart = Math.max(0, el.scrollHeight - el.clientHeight);
    if (maxStart > 0) {
      el.scrollTop = ((index * 0.27) % 1) * maxStart;
    }

    let raf = 0;
    let running = true;

    const tick = () => {
      if (!running) return;

      if (!pausedRef.current && !lightboxPausedRef.current) {
        const max = el.scrollHeight - el.clientHeight;
        if (max > 1) {
          el.scrollTop += speed * directionRef.current;
          if (el.scrollTop >= max - 0.5) {
            el.scrollTop = max;
            directionRef.current = -1;
          } else if (el.scrollTop <= 0.5) {
            el.scrollTop = 0;
            directionRef.current = 1;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onPointerDown = () => pause();
    const onPointerUp = () => scheduleResume();
    const onWheel = () => {
      pause();
      scheduleResume();
    };
    const onTouchStart = () => pause();
    const onTouchEnd = () => scheduleResume();

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    const onMotionChange = () => {
      if (reduceMotion.matches) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    reduceMotion.addEventListener("change", onMotionChange);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      reduceMotion.removeEventListener("change", onMotionChange);
    };
  }, [index, pause, scheduleResume, speed]);

  return (
    <article className={styles.column}>
      <header className={styles.header}>
        <p className={styles.date}>{event.date}</p>
        <h2 className={styles.title}>{event.title}</h2>
      </header>
      <div className={styles.scroll} ref={scrollRef}>
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
