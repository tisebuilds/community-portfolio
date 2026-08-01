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
  { slug: "sunset-smores", title: "Sunset & S’mores", date: "2026-07-09", partifulUrl: "https://partiful.com/e/w8E3zwFEfs4AegyjqEFK" },
  { slug: "juneteenth-boba", title: "Juneteenth Boba Walk", date: "2026-06-20", partifulUrl: "https://partiful.com/e/nIcKxp2V1VIEwbS8tyT7" },
  { slug: "dinner-queens", title: "Dinner In Queens", date: "2026-02-16", partifulUrl: "https://partiful.com/e/k02eZyEwhALxReDjMhcg" },
  { slug: "nye-happy-hour", title: "New Year Happy Hour", date: "2026-01-29", partifulUrl: "https://partiful.com/e/E8mPXyw6T7wEIiHlYIxH" },
  { slug: "new-boundaries", title: "New Year, New Boundaries", date: "2026-01-22", partifulUrl: "https://partiful.com/e/u0xcfQCHwsXjfIgMjzvH" },
  { slug: "spotify-wrapped", title: "Spotify Wrapped Listening Party", date: "2025-12-19", partifulUrl: "https://partiful.com/e/7cP5LpPL9D2KvTgebFvA" },
  { slug: "cookie-swap", title: "Holiday Cookie Swap", date: "2025-12-11", partifulUrl: "https://partiful.com/e/9MNnc3XoOu6UjJsbNYcD" },
  { slug: "alumni-potluck-sep", title: "Alumni Potluck", date: "2025-09-13", partifulUrl: "https://partiful.com/e/BHFooR5VPb0dySTXnlQv" },
  { slug: "boba-walk-madison", title: "Boba & Walk, Madison Sq Park 1.0", date: "2025-05-27", partifulUrl: "https://partiful.com/e/cT2eInZbKNXP0Q585D62" },
  { slug: "alumni-dinner-party", title: "Alumni Dinner Party", date: "2025-02-25", partifulUrl: "https://partiful.com/e/Mwbb80qNxkejbwiWZJRY" },
  { slug: "career-workshop", title: "Alumni Career Workshop", date: "2025-01-23", partifulUrl: "https://partiful.com/e/kPGAU2HIlOQwe98KoBb9" },
  { slug: "potluck-vol1", title: "Potluck In The Park, Vol. 1", date: "2024-10-20", partifulUrl: "https://partiful.com/e/A5T675OwKu3VNb9PmjQ1" },
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

/** Real photos under /public/events/[slug]/ keyed by event slug. */
const EVENT_PHOTOS: Partial<Record<(typeof EVENT_META)[number]["slug"], Photo[]>> = {
  "boba-walk-madison": [
    {
      id: "boba-walk-madison-01",
      src: "/events/boba-walk-madison/01.png",
      alt: "Group holding boba outside after Madison Square Park walk",
      day: "01",
      frame: "01",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
  ],
  "career-workshop": [
    {
      id: "career-workshop-01",
      src: "/events/career-workshop/01.png",
      alt: "Alumni gathered around a conference table during Junior to Senior workshop",
      day: "01",
      frame: "01",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "career-workshop-02",
      src: "/events/career-workshop/02.png",
      alt: "Alumni Career Workshop group eating pizza in the conference room",
      day: "02",
      frame: "02",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
  ],
  "spotify-wrapped": [
    {
      id: "spotify-wrapped-01",
      src: "/events/spotify-wrapped/01.png",
      alt: "Group posing on tiered seating at Spotify Wrapped listening party",
      day: "01",
      frame: "01",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "spotify-wrapped-02",
      src: "/events/spotify-wrapped/02.png",
      alt: "Guests talking and laughing on the lounge tiers",
      day: "02",
      frame: "02",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "spotify-wrapped-03",
      src: "/events/spotify-wrapped/05.png",
      alt: "Four people in conversation during the listening party",
      day: "03",
      frame: "03",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "spotify-wrapped-04",
      src: "/events/spotify-wrapped/04.png",
      alt: "Full group photo on wooden bleachers with pizza plates",
      day: "04",
      frame: "04",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "spotify-wrapped-05",
      src: "/events/spotify-wrapped/03.png",
      alt: "Small group chatting by the presentation screen",
      day: "05",
      frame: "05",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
  ],
  "alumni-potluck-sep": [
    {
      id: "alumni-potluck-sep-01",
      src: "/events/alumni-potluck-sep/01.png",
      alt: "Walking a park path with the Manhattan skyline across the water at sunset",
      day: "01",
      frame: "01",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "alumni-potluck-sep-02",
      src: "/events/alumni-potluck-sep/02.png",
      alt: "Alumni picnic on a checkered blanket with Joe's Pizza",
      day: "02",
      frame: "02",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
  ],
  "cookie-swap": [
    {
      id: "cookie-swap-01",
      src: "/events/cookie-swap/05.png",
      alt: "Two guests giving thumbs up in front of the Cookie Swap screen",
      day: "01",
      frame: "01",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "cookie-swap-02",
      src: "/events/cookie-swap/06.png",
      alt: "Group photo on the tiered seating after the cookie swap",
      day: "02",
      frame: "02",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "cookie-swap-03",
      src: "/events/cookie-swap/03.png",
      alt: "Close-up of cookie boxes, egg nog, and holiday treats on the counter",
      day: "03",
      frame: "03",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "cookie-swap-04",
      src: "/events/cookie-swap/04.png",
      alt: "Guests gathered around a lounge table during the cookie swap",
      day: "04",
      frame: "04",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "cookie-swap-05",
      src: "/events/cookie-swap/01.png",
      alt: "Assorted cookies lined up on the counter under the Swap screen",
      day: "05",
      frame: "05",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "cookie-swap-06",
      src: "/events/cookie-swap/02.png",
      alt: "Group sharing a meal at round tables by the windows",
      day: "06",
      frame: "06",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
  ],
  "alumni-dinner-party": [
    {
      id: "alumni-dinner-party-01",
      src: "/events/alumni-dinner-party/04.png",
      alt: "Candid dinner conversation by the brick wall",
      day: "01",
      frame: "01",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "alumni-dinner-party-02",
      src: "/events/alumni-dinner-party/02.png",
      alt: "Shared platter of grilled meats and seafood at the dinner",
      day: "02",
      frame: "02",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "alumni-dinner-party-03",
      src: "/events/alumni-dinner-party/03.png",
      alt: "Group smiling for a photo at the dinner table",
      day: "03",
      frame: "03",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "alumni-dinner-party-04",
      src: "/events/alumni-dinner-party/01.png",
      alt: "Alumni gathered around a long table at Steinway Steak House",
      day: "04",
      frame: "04",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
  ],
  "potluck-vol1": [
    {
      id: "potluck-vol1-01",
      src: "/events/potluck-vol1/01.png",
      alt: "Picnic circle on blankets in Central Park with the skyline beyond",
      day: "01",
      frame: "01",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
    {
      id: "potluck-vol1-02",
      src: "/events/potluck-vol1/02.png",
      alt: "Two guests smiling on a blue blanket at the park potluck",
      day: "02",
      frame: "02",
      aspect: "3 / 4",
      width: 768,
      height: 1024,
    },
    {
      id: "potluck-vol1-03",
      src: "/events/potluck-vol1/03.png",
      alt: "Group sitting under the trees sharing snacks at the potluck",
      day: "03",
      frame: "03",
      aspect: "4 / 3",
      width: 1024,
      height: 768,
    },
  ],
};

export const events: Event[] = EVENT_META.map((event) => {
  const parsed = parseDate(event.date);
  return {
    ...event,
    date: formatShortDate(parsed),
    week: isoWeek(parsed),
    weekRange: formatWeekRange(parsed),
    photos: EVENT_PHOTOS[event.slug] ?? placeholderPhotos(event.slug, event.title),
  };
});
