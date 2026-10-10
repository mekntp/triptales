# 🚗📸 TripTales

> **"Plan the trip. Capture the memories."**  
> *เรื่องราวการเดินทาง • วางแผนทริป บันทึกความทรงจำ*  
> *旅行物语 • 规划旅程 珍藏回忆*

**TripTales** is a universal, mobile-first Progressive Web App (PWA) designed for family travel, international city discovery, configurable multi-trip itineraries, and engaging photo scavenger hunts. Built to be offline-first, multilingual (English 🇺🇸, Thai 🇹🇭, Simplified Chinese 🇨🇳), child-friendly, and privacy-focused, TripTales stores trip itineraries, photos, and notes on your device with optional zero-knowledge/authenticated Supabase cloud sync.

---

## ✨ Key Features & Capabilities

### 🧳 1. First-Class Multi-Trip Management ("My Trips")
- **Create, Edit & Duplicate**: Create unlimited trips with custom destination cities, travel dates, titles, and descriptions. Duplicate trips for seasonal recurrence.
- **Archive & Restore**: Archive completed journeys to declutter active views while preserving all notes and photos.
- **Strict Data Isolation**: Places, mission progress, photos, and daily journals are strictly segregated by `tripId` across local IndexedDB and cloud stores.
- **Persistent Selection**: Seamlessly switch between trips anytime without data mixing or accidental overwrites.

### 🌍 2. International City Search & Destination Discovery
- **OpenStreetMap Nominatim Geocoding**: Search cities worldwide with debounced inputs and client-side caching compliant with OSM usage policies and custom User-Agent headers.
- **Verified Place Recommendations**: Browse curated and live Overpass POI highlights across 6 categories:
  - 📍 Attractions & Landmarks
  - 🏛️ Museums & Culture
  - 🌳 Parks & Nature
  - 🎡 Child & Family Fun
  - 🛍️ Markets & Shopping
  - 🌟 All Highlights
- **Add to Any Trip**: Add any discovered place directly to the active trip or any saved trip with one tap.
- **Start Trip from City**: Instantly generate a new travel itinerary centered around any searched destination.

### 🗺️ 3. Itinerary & Driving Route Planning
- **Configurable Places**: Add, edit, remove, and reorder stops without hardcoded data.
- **Tri-State Status**: `Planned` (on route), `Visited` (checked in), `Skipped` (excluded from route calculations).
- **Interactive Route Map**: Powered by Leaflet & OpenStreetMap (100% free, zero required API keys).
- **Leg-by-Leg Turn-by-Turn Navigation**: Direct Google Maps links for individual legs and full routes (`https://www.google.com/maps/dir/?api=1...`).
- **Honest Driving Distance & Duration Disclosures**:
  - Employs Haversine distance scaled by a **1.28× road winding factor**.
  - Dynamically calculates driving speeds (35 km/h urban for legs < 5 km; 60 km/h highway for legs ≥ 5 km).
  - Explicit `~` indicators and disclaimers explaining calculations are geometric estimates rather than real-time live traffic.
- **Route Optimization (TSP Heuristic)**:
  - Anchors the starting location (`origin`) and reorders subsequent destinations using nearest-neighbor optimization with 2-Opt local search refinement.
  - Previews distance and time savings in an explicit confirmation dialog before applying.

### 📸 4. Photo Scavenger Hunt & Missions
- **Multi-Photo Capture**: Upload or snap multiple photos per mission (`capture="environment"` support).
- **Undo / Do Again Flow**: Redo completed missions without deleting existing photos, star ratings, or notes.
- **Individual Photo Management**: Delete individual photos with one tap while preserving the rest.
- **Child-Friendly Star Grading**:
  - ⭐ 1 Star: Found the target
  - ⭐⭐ 2 Stars: Found + snapped photos
  - ⭐⭐⭐ 3 Stars: Kids took the photos themselves!
- **Victory Modal & Certificates**: Certificate generation with earned titles and photo scrapbook.

### 🎨 5. Appearance, Themes & Accessibility
- **Light, Dark & System Themes**: Full dark-mode styling across all headers, cards, dialogs, forms, and tabs.
- **Customizable Preferences**: Distance units toggle (kilometers `km` vs. miles `mi`), persisted in local storage.

### 📱 6. Mobile Back Button Interceptor
- **Reliable Back Button Dialog**: Intercepts Android hardware back gestures and browser Back clicks via standard HTML5 History API `popstate` events.
- **Modal-First Dismissal Priority**: If a preview photo, victory dialog, or settings modal is open, pressing Back dismisses the active modal first without triggering exit confirmation.
- **Safe Exit & Unsaved Changes Warning**: Alerts users if unpersisted edits exist before exiting, preventing accidental app dismissal during road trips.
- **Infinite Loop Prevention**: Employs an exit flag (`isExitingRef`) so deliberate exit navigations succeed without getting trapped in history loops.

### 🔒 7. Cloud Sync, Supabase Auth & Row Level Security (RLS)
- **Offline-First IndexedDB v3**: Automatically migrates legacy records without data loss.
- **Genuine 2-Way Backup & Restore**: "Sync to Cloud" and "Restore from Cloud" mechanisms using Last-Write-Wins (LWW) conflict reconciliation and deletion tombstones (`is_deleted`).
- **Production Row Level Security (RLS)**: Enforces authenticated user ownership policies (`auth.uid() = user_id`) on all tables (`trips`, `places`, `photo_missions`, `photos`, `trip_journal`) and isolates storage objects inside user-scoped folders (`user-id/trip-id/...`).
- **Authentication & OAuth**: Supports Magic Link passwordless sign-in and Google / Apple / Facebook OAuth authentication options.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/) + OpenStreetMap
- **Local Storage**: IndexedDB (v3 schema) + localStorage
- **Backend & Auth**: [Supabase](https://supabase.com/) (Postgres DB, Magic Link Passwordless Auth, OAuth, Storage)
- **Hosting**: [Vercel](https://vercel.com/)

---

## 🚀 Local Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/mekntp/triptales.git
cd triptales
npm install
```

### 2. Configure Environment Variables

Create `.env` in the project root:

```env
# Supabase Configuration (Supabase Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Google Maps API Key (Optional — Leaflet + OpenStreetMap are active by default with zero billing required)
VITE_GOOGLE_MAPS_API_KEY=
```

### 3. Run Development Server & Tests

```bash
# Run unit tests (Route estimation, Multi-trip isolation, LWW conflict resolution, City discovery)
npm test

# Run development server
npm run dev

# Run production build
npm run build
```

---

## 🗄️ Supabase Migration & Security (RLS Setup)

To configure Supabase with Row Level Security and authenticated backup/restore:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor**.
3. Run the initial migration [`supabase/migration_triptales.sql`](./supabase/migration_triptales.sql) if tables do not exist yet.
4. Run the security hardening migration [`supabase/migration_v2_security_and_rls.sql`](./supabase/migration_v2_security_and_rls.sql):
   - Adds `user_id` and `is_deleted` columns across tables.
   - Enables Row Level Security (RLS) on `trips`, `places`, `photo_missions`, `photos`, and `trip_journal`.
   - Restricts SELECT, INSERT, UPDATE, DELETE to authenticated owners (`auth.uid() = user_id`).
   - Configures storage bucket `trip-photos` policies so each user can only upload and read files within their own folder (`(storage.foldername(name))[1] = auth.uid()::text`).
5. In **Authentication -> Providers -> Email**, enable Email OTP (Magic Link) so users can sign in passwordlessly without remembering passwords during trips.
6. (Optional) In **Authentication -> Providers -> Google / Apple / Facebook**, configure Client IDs and Secrets for social sign-in.

---

## 🌐 Deploy to Vercel

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Deploy TripTales PWA with Multi-Trip and City Discovery"
   git push origin main
   ```
2. Link the repository in [Vercel](https://vercel.com/).
3. Add Environment Variables in Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. The PWA will automatically support offline caching via service workers.

---

## 📱 Browser & PWA Limitations

- **System Back Gestures**: The HTML5 History API intercepts `popstate` events reliably on Android Chrome, Edge, and iOS Safari. However, some browser vendors restrict trapping `popstate` if the user has not performed an initial interaction on the page. TripTales registers history states upon initial user touch/click.
- **Driving Durations**: Driving times are calculated geometrically using a 1.28× winding factor and speed heuristics. Real-time traffic jams, detours, and road closures are reflected via the direct "Google Maps" navigation links.
- **City Search Quotas**: OpenStreetMap Nominatim and Overpass API have public rate limits (~1 req/sec). TripTales utilizes client-side caching and curated destination highlights for high resilience and offline operation.

---

## 📄 License

MIT License © 2026 TripTales — Plan the trip. Capture the memories.
