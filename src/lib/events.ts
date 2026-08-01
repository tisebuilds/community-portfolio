export type Photo = {
  id: string;
  src: string;
  alt: string;
  /** Day label under the photo, e.g. "Mon" */
  day: string;
  frame: string;
  /** CSS aspect-ratio value, e.g. "3 / 2" */
  aspect: string;
  width: number;
  height: number;
};

export type Event = {
  slug: string;
  title: string;
  date: string;
  /** Partiful event page */
  partifulUrl: string;
  /** Calendar week number shown as "Week N" */
  week: number;
  /** Display range, e.g. "Jul 6 – 12" */
  weekRange: string;
  photos: Photo[];
};

const EVENT_META = [
  { slug: "sunset-smores", title: "Sunset & S’mores", date: "2026-07-09", partifulUrl: "" },
  { slug: "juneteenth-boba", title: "Juneteenth Boba Walk", date: "2026-06-20", partifulUrl: "" },
  { slug: "dinner-queens", title: "Dinner In Queens", date: "2026-02-16", partifulUrl: "" },
  { slug: "nye-happy-hour", title: "New Year Happy Hour", date: "2026-01-29", partifulUrl: "" },
  { slug: "new-boundaries", title: "New Year, New Boundaries", date: "2026-01-22", partifulUrl: "" },
  { slug: "spotify-wrapped", title: "Spotify Wrapped Listening Party", date: "2025-12-19", partifulUrl: "" },
  { slug: "cookie-swap", title: "Holiday Cookie Swap", date: "2025-12-11", partifulUrl: "" },
  { slug: "alumni-potluck-sep", title: "Alumni Potluck", date: "2025-09-13", partifulUrl: "" },
  { slug: "boba-walk-madison", title: "Boba & Walk, Madison Sq Park 1.0", date: "2025-05-27", partifulUrl: "" },
  { slug: "alumni-dinner-party", title: "Alumni Dinner Party", date: "2025-02-25", partifulUrl: "" },
  { slug: "career-workshop", title: "Alumni Career Workshop", date: "2025-01-23", partifulUrl: "" },
  { slug: "potluck-vol1", title: "Potluck In The Park, Vol. 1", date: "2024-10-20", partifulUrl: "" },
] as const;

const PHOTOS_PER_EVENT = 7;

/** Mixed frame shapes — landscape / square / portrait like a real roll */
const FRAME_SHAPES = [
  { aspect: "3 / 2", width: 720, height: 480 },
  { aspect: "3 / 4", width: 480, height: 640 },
  { aspect: "1 / 1", width: 640, height: 640 },
  { aspect: "4 / 3", width: 640, height: 480 },
  { aspect: "2 / 3", width: 480, height: 720 },
  { aspect: "16 / 9", width: 800, height: 450 },
  { aspect: "5 / 4", width: 600, height: 480 },
] as const;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Display as M/D/YY, e.g. 7/9/26 */
function formatShortDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = String(date.getFullYear()).slice(-2);
  return `${m}/${d}/${y}`;
}

/** ISO-8601 week number (Mon-based). */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatWeekRange(date: Date): string {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${formatShortDate(start)}–${formatShortDate(end)}`;
}

function placeholderPhotos(slug: string, title: string): Photo[] {
  return Array.from({ length: PHOTOS_PER_EVENT }, (_, i) => {
    const n = i + 1;
    const frame = String(n).padStart(2, "0");
    const shape = FRAME_SHAPES[i % FRAME_SHAPES.length];
    return {
      id: `${slug}-${frame}`,
      src: `https://picsum.photos/seed/${slug}${n}/${shape.width}/${shape.height}`,
      alt: `${title} — ${frame}`,
      day: frame,
      frame,
      aspect: shape.aspect,
      width: shape.width,
      height: shape.height,
    };
  });
}

export const events: Event[] = EVENT_META.map((event) => {
  const parsed = parseDate(event.date);
  return {
    ...event,
    date: formatShortDate(parsed),
    week: isoWeek(parsed),
    weekRange: formatWeekRange(parsed),
    photos: placeholderPhotos(event.slug, event.title),
  };
});
