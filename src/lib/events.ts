export type Photo = {
  id: string;
  src: string;
  alt: string;
  /** Frame number shown under the print, e.g. "01" */
  frame: string;
};

export type Event = {
  slug: string;
  title: string;
  date: string;
  photos: Photo[];
};

const EVENT_META = [
  { slug: "sunset-smores", title: "Sunset & S’mores", date: "Jul 9, 2026" },
  { slug: "juneteenth-boba", title: "Juneteenth Boba Walk", date: "Jun 20, 2026" },
  { slug: "coworking-friday", title: "Coworking Friday", date: "Feb 27, 2026" },
  { slug: "dinner-queens", title: "Dinner in Queens", date: "Feb 16, 2026" },
  { slug: "nye-happy-hour", title: "New Year Happy Hour", date: "Jan 29, 2026" },
  { slug: "new-boundaries", title: "New Year, New Boundaries", date: "Jan 22, 2026" },
  { slug: "spotify-wrapped", title: "Spotify Wrapped Listening Party", date: "Dec 19, 2025" },
  { slug: "cookie-swap", title: "Holiday Cookie Swap", date: "Dec 11, 2025" },
  { slug: "alumni-potluck-sep", title: "Alumni Potluck", date: "Sep 13, 2025" },
  { slug: "boba-walk-madison", title: "Boba & Walk, Madison Sq Park", date: "May 27, 2025" },
  { slug: "ai-happy-hour", title: "AI Happy Hour", date: "Apr 25, 2025" },
  { slug: "alumni-dinner-party", title: "Alumni Dinner Party", date: "Feb 25, 2025" },
  { slug: "career-workshop", title: "Alumni Career Workshop", date: "Jan 23, 2025" },
  { slug: "potluck-vol1", title: "Potluck in the Park, Vol. 1", date: "Oct 20, 2024" },
] as const;

const PHOTOS_PER_EVENT = 8;

/** Placeholder picsum URLs — replace `src` per photo when real assets are ready. */
function placeholderPhotos(slug: string, title: string): Photo[] {
  return Array.from({ length: PHOTOS_PER_EVENT }, (_, i) => {
    const n = i + 1;
    const frame = String(n).padStart(2, "0");
    return {
      id: `${slug}-${frame}`,
      src: `https://picsum.photos/seed/${slug}${n}/400/520`,
      alt: `${title} — frame ${frame}`,
      frame,
    };
  });
}

export const events: Event[] = EVENT_META.map((event) => ({
  ...event,
  photos: placeholderPhotos(event.slug, event.title),
}));
