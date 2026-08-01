"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { flushSync } from "react-dom";
import type { Event, Photo } from "@/lib/events";
import { events } from "@/lib/events";
import styles from "./FilmShelf.module.css";

type Theme = "light" | "dark";

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type FocusTarget = {
  event: Event;
  photo: Photo;
  /** Strip frame rect at click — FLIP origin / close destination. */
  from: Rect;
  left: number;
  top: number;
  width: number;
  height: number;
};

const FOCUS_MS = 320;
const FOCUS_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHELF_FADE_MS = 330;
const SHELF_FADE_EASE = "cubic-bezier(0.33, 0, 0.2, 1)";
/** Delay between neighboring strips on exit reveal. */
const SHELF_STAGGER_MS = 70;

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 4h6v6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14 20 4"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* ignore quota / private mode */
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTransitions(): boolean {
  return typeof document.startViewTransition === "function";
}

/** Expand new theme in a circle from the toggle button. */
function transitionTheme(next: Theme, origin: DOMRect) {
  const switchTheme = () => applyTheme(next);

  if (!supportsViewTransitions() || prefersReducedMotion()) {
    switchTheme();
    return;
  }

  const x = origin.left + origin.width / 2;
  const y = origin.top + origin.height / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(switchTheme);

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 480,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

/** Stable slight tilt from slug, about ±0.7°–1.8°. */
function stripTilt(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  const unit = ((Math.abs(hash) % 1000) / 1000) * 2 - 1;
  const degrees = (unit < 0 ? -1 : 1) * (0.7 + Math.abs(unit) * 1.1);
  return `${degrees.toFixed(2)}deg`;
}

function centeredPhotoRect(photo: Photo): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const maxW = Math.min(window.innerWidth * 0.9, 560);
  const maxH = window.innerHeight - 140;
  const aspect = photo.width / photo.height;
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2 - 12,
  };
}

function flipTo(
  el: HTMLElement,
  from: Rect,
  to: Rect,
): Animation | null {
  if (prefersReducedMotion()) return null;

  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;

  return el.animate(
    [
      {
        transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
      },
      { transform: "translate(0, 0) scale(1, 1)" },
    ],
    {
      duration: FOCUS_MS,
      easing: FOCUS_EASE,
      fill: "none",
    },
  );
}

function rectFromDom(r: DOMRect): Rect {
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
  };
}

/** Sum CSS rotations from el up to the document (strip tilt lives on .photoRow). */
function ancestorRotationDeg(el: HTMLElement): number {
  let angle = 0;
  let node: HTMLElement | null = el;
  while (node && node !== document.documentElement) {
    const t = getComputedStyle(node).transform;
    if (t && t !== "none") {
      const m = new DOMMatrixReadOnly(t);
      angle += Math.atan2(m.b, m.a) * (180 / Math.PI);
    }
    node = node.parentElement;
  }
  return angle;
}

/**
 * Animate the floating photo back onto its strip slot, matching size + tilt
 * (getBoundingClientRect is an AABB and would land wrong on a rotated strip).
 */
function flipCloseToSlot(
  el: HTMLElement,
  active: FocusTarget,
  slotEl: HTMLButtonElement,
): Animation {
  const w = slotEl.offsetWidth;
  const h = slotEl.offsetHeight;
  const aabb = slotEl.getBoundingClientRect();
  const toCx = aabb.left + aabb.width / 2;
  const toCy = aabb.top + aabb.height / 2;
  const fromCx = active.left + active.width / 2;
  const fromCy = active.top + active.height / 2;
  const angle = ancestorRotationDeg(slotEl);

  return el.animate(
    [
      {
        transform: "translate(0, 0) scale(1, 1) rotate(0deg)",
        transformOrigin: "center center",
      },
      {
        transform: `translate(${toCx - fromCx}px, ${toCy - fromCy}px) scale(${w / active.width}, ${h / active.height}) rotate(${angle}deg)`,
        transformOrigin: "center center",
      },
    ],
    {
      duration: FOCUS_MS,
      easing: FOCUS_EASE,
      fill: "forwards",
    },
  );
}

export default function FilmShelf() {
  const [active, setActive] = useState<FocusTarget | null>(null);
  const [scrimLeaving, setScrimLeaving] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const photoEls = useRef(new Map<string, HTMLButtonElement>());
  const focusElRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);
  const skipOpenFlip = useRef(false);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  /* Floating photo lives outside the tilted strip so fixed positioning works. */
  useLayoutEffect(() => {
    if (!active || skipOpenFlip.current || closingRef.current) return;
    const el = focusElRef.current;
    if (!el) return;
    flipTo(el, active.from, active);
  }, [active]);

  const onPhotoClick = useCallback(
    (event: Event, photo: Photo, el: HTMLButtonElement) => {
      if (active || closingRef.current) return;

      const from = rectFromDom(el.getBoundingClientRect());
      const target = centeredPhotoRect(photo);
      skipOpenFlip.current = false;
      setScrimLeaving(false);
      setActive({
        event,
        photo,
        from,
        ...target,
      });
    },
    [active],
  );

  const onClose = useCallback(() => {
    if (!active || closingRef.current) return;
    closingRef.current = true;
    skipOpenFlip.current = true;

    const el = focusElRef.current;
    const slotEl = photoEls.current.get(active.photo.id);
    const header = headerRef.current;
    const feed = feedRef.current;
    const weeks = feed
      ? Array.from(feed.querySelectorAll<HTMLElement>("[data-event-slug]"))
      : [];

    const clearInline = () => {
      header?.style.removeProperty("transition");
      header?.style.removeProperty("opacity");
      for (const week of weeks) {
        week.style.removeProperty("transition");
        week.style.removeProperty("opacity");
      }
      slotEl?.style.removeProperty("opacity");
    };

    const finish = () => {
      flushSync(() => {
        setActive(null);
        setScrimLeaving(false);
      });
      clearInline();
      closingRef.current = false;
    };

    setScrimLeaving(true);

    if (!el || !slotEl || prefersReducedMotion()) {
      finish();
      return;
    }

    const anim = flipCloseToSlot(el, active, slotEl);

    void anim.finished
      .then(async () => {
        // Strip ready under the floater (overrides .photoInStripHidden).
        slotEl.style.opacity = "1";

        const fadeIn = (node: HTMLElement | null, delayMs: number) => {
          if (!node) return;
          node.style.transition = "none";
          node.style.opacity = "0";
          void node.offsetHeight;
          node.style.transition = `opacity ${SHELF_FADE_MS}ms ${SHELF_FADE_EASE} ${delayMs}ms`;
          node.style.opacity = "1";
        };

        // Home strip fades in fully first; then header + other rolls stagger in.
        const activeIdx = weeks.findIndex(
          (week) => week.dataset.eventSlug === active.event.slug,
        );
        const homeIdx = activeIdx >= 0 ? activeIdx : 0;

        fadeIn(weeks[homeIdx] ?? null, 0);

        const afterHome = SHELF_FADE_MS;
        fadeIn(header, afterHome);

        let maxDelay = afterHome;
        weeks.forEach((week, i) => {
          if (i === homeIdx) return;
          const order = Math.abs(i - homeIdx);
          const delay = afterHome + order * SHELF_STAGGER_MS;
          maxDelay = Math.max(maxDelay, delay);
          fadeIn(week, delay);
        });

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, maxDelay + SHELF_FADE_MS);
        });

        finish();
      })
      .catch(finish);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);

  const onToggleTheme = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const origin = event.currentTarget.getBoundingClientRect();
      transitionTheme(next, origin);
      setTheme(next);
    },
    [theme],
  );

  return (
    <div
      className={[
        styles.page,
        active ? styles.pageFocused : "",
        scrimLeaving ? styles.pageUnfocusing : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header
        ref={headerRef}
        className={styles.header}
        aria-hidden={active ? true : undefined}
      >
        <div className={styles.headerText}>
          <p className={styles.handle}>I&apos;m A Designer Who Loves Hosting Things</p>
        </div>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <span className={styles.themeIconLight}>
            <MoonIcon />
          </span>
          <span className={styles.themeIconDark}>
            <SunIcon />
          </span>
        </button>
      </header>

      <main
        ref={feedRef}
        className={styles.feed}
        aria-hidden={active ? true : undefined}
      >
        {events.map((event) => (
          <section
            key={event.slug}
            className={styles.week}
            data-event-slug={event.slug}
            aria-label={event.title}
          >
            <div
              className={styles.photoRow}
              style={{ "--tilt": stripTilt(event.slug) } as CSSProperties}
            >
              <div className={styles.filmStrip}>
                <div className={styles.sprocketRail} aria-hidden="true" />
                <div className={styles.stripMeta}>
                  {event.partifulUrl ? (
                    <a
                      className={styles.eventLink}
                      href={event.partifulUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h2 className={styles.weekLabel}>{event.title}</h2>
                      <span className={styles.externalLink} aria-hidden="true">
                        <ExternalLinkIcon />
                      </span>
                    </a>
                  ) : (
                    <div className={styles.eventLink}>
                      <h2 className={styles.weekLabel}>{event.title}</h2>
                      <span className={styles.externalLink} aria-hidden="true">
                        <ExternalLinkIcon />
                      </span>
                    </div>
                  )}
                  <p className={styles.weekRange}>{event.date}</p>
                </div>
                <div className={styles.frames}>
                  {event.photos.map((photo) => {
                    const focused = active?.photo.id === photo.id;
                    return (
                      <div key={photo.id} className={styles.frame}>
                        <button
                          type="button"
                          className={
                            focused
                              ? `${styles.photoBtn} ${styles.photoInStripHidden}`
                              : styles.photoBtn
                          }
                          style={{ aspectRatio: photo.aspect }}
                          ref={(node) => {
                            if (node) photoEls.current.set(photo.id, node);
                            else photoEls.current.delete(photo.id);
                          }}
                          onClick={(e) => {
                            if (focused) return;
                            onPhotoClick(event, photo, e.currentTarget);
                          }}
                          aria-label={`Open ${photo.alt}`}
                          aria-hidden={focused || undefined}
                          tabIndex={focused ? -1 : undefined}
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
                    );
                  })}
                </div>
                <div className={styles.sprocketRail} aria-hidden="true" />
              </div>
            </div>
          </section>
        ))}
      </main>

      {active ? (
        <>
          <button
            type="button"
            className={styles.focusHit}
            aria-label="Close photo"
            onClick={onClose}
          />
          <button
            type="button"
            ref={focusElRef}
            className={styles.photoFocused}
            style={{
              left: active.left,
              top: active.top,
              width: active.width,
              height: active.height,
            }}
            onClick={onClose}
            aria-label={`Close ${active.photo.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.photo.src}
              alt={active.photo.alt}
              width={active.photo.width}
              height={active.photo.height}
              className={styles.photoFocusedImg}
            />
          </button>
          <p
            className={styles.focusCaption}
            style={{
              top: active.top + active.height + 14,
            }}
          >
            {active.event.title} · {active.event.date}
          </p>
        </>
      ) : null}
    </div>
  );
}
