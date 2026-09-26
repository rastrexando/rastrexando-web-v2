# Create Event Skill

This skill creates new rastrexos (treasure hunts) or andainas (walking events) for the Rastrexando site.

## Required Information

Collect from the user:
- **title**: Event name (e.g., "IX Rastrexo Camos")
- **date**: Event date (YYYY-MM-DD format)
- **type**: Either "rastrexo" or "andaina"
- **location**: Locality and municipality (e.g., "Campos, Nigrán")
- **province** (optional): province for structured data (e.g., "Pontevedra")
- **map_lat** / **map_lng** (optional): approximate coordinates of the locality or event area, never the departure point unless confirmed. Prefer adding the location to `_data/locations.json` so historical and future events reuse it; use front matter only for an explicit override.
- **organizers**: One or more organization names and, when available, their official website or social profiles
- **source_url** (optional): URL of the original event announcement, registration page, or another event-specific direct source. Do not use an organization profile as the event source.
- **image_url**: URL to download the event poster/image from
- **body** (optional): HTML content for the event description. See "Body text rules" below.
- **videos** (optional): Array of YouTube video objects with `id`, `title`, and optional `published` (`YYYY-MM-DD`) and `channel`
- **notices** (optional): Array of important event notices with `date` (`YYYY-MM-DD`) and a Galician `message`. Notices render between the event information card and the map.

## Body text rules

When the user provides descriptive text for the event:
- **Translate to Galician** if the text is in Spanish (the site language is Galician)
- **Exclude personal information**: email addresses, phone numbers, registration/contact details
- **Keep general event info**: descriptions, team sizes, prices, fundraising purpose, age ranges, etc.
- Wrap each paragraph in `<p>` tags
- Place body content after the frontmatter closing `---`

## Workflow

### 1. Generate the filename slug

Convert the title to a slug:
- Lowercase all letters
- Replace spaces with hyphens
- Preserve Roman numerals (I, II, III, IV, V, VI, VII, VIII, IX, X, etc.)
- Remove special characters except hyphens
- Example: "IX Rastrexo Camos" → `ix-rastrexo-camos`
- Example: "IV Rastrexo de Coruxo: El Gran Juego" → `iv-rastrexo-coruxo-el-gran-juego`

### 2. Determine the year

Extract the year from the date field (first 4 characters).

### 3. Download the image

```bash
curl -L -o recursos/imaxes/<year>/<image-filename> <image_url>
```

The image filename should be descriptive and lowercase (e.g., `ix-camos.jpg`, `areas.jpeg`).

### 4. Create year directories if needed

Check if these exist, create if missing:
- `calendarios/<year>/`
- `recursos/imaxes/<year>/`

### 5. Update years.json if needed

Check if the year exists in `_data/years.json`. If not, add it in chronological order.

### 6. Resolve the approximate location

1. Run `npm run geocode -- "<location>"`.
2. If it returns a catalogue entry, use the exact same `location` text in the event front matter.
3. If it returns Nominatim candidates, validate that the selected result represents the locality or event area — never infer an exact departure point.
4. Save the confirmed result before creating the event:

```bash
npm run geocode -- "<location>" --add --lat <latitude> --lng <longitude> --province <province>
```

Do not run geocoding in batches or in parallel. The lookup command never changes the catalogue.

### 7. Resolve the organizations

1. Read `_data/organizations.json` and look for each organizer before creating a new entity.
2. Match primarily by a canonical website or social account. Treat normalized names only as suggestions and review ambiguous matches.
3. Reuse the existing stable `slug` when a match exists.
4. If the organization is new, add one object to `_data/organizations.json` in alphabetical order:

```json
{
  "slug": "<stable-organization-slug>",
  "name": "<display name>",
  "links": {
    "website": "<optional canonical website>",
    "facebook": "<optional canonical Facebook profile>",
    "instagram": "<optional canonical Instagram profile>"
  }
}
```

Omit empty link properties. An optional `logo` may reference a local image below `recursos/imaxes/`; never hotlink a remote logo.

Use `organizers` for entities responsible for or materially involved in the event. Do not create a duplicate entity merely because an older event used another spelling. Collaborator roles are not currently distinguished.

### 8. Create the event file

Create `calendarios/<year>/<slug>.njk` with this template:

```njk
---
layout: post
tags: ["post", "<year>", "<type>"]
title: "<title>"
date: <YYYY-MM-DD>
organizers:
  - <organization-slug>
source_url: <optional event-specific source_url>
location: "<location>"
province: "<optional province>"
map_lat: <optional approximate latitude>
map_lng: <optional approximate longitude>
image: <year>/<image-filename>
---

<optional body HTML>
```

If videos are provided, add them to the frontmatter:

```yaml
videos:
  - id: <youtube-video-id>
    title: "<video title>"
    published: <optional YYYY-MM-DD upload date>
    channel: "<optional channel name>"
```

If notices are provided, add them to the frontmatter instead of calling `renderNotice` in the body:

```yaml
notices:
  - date: <YYYY-MM-DD>
    message: "<notice text in Galician>"
```

Omit `source_url` when no event-specific original source is available. Organization profile links belong only in `_data/organizations.json`.

### 9. Verify the build

Run `npx @11ty/eleventy` to ensure the site builds without errors.

## Example

User provides:
- title: "IX Rastrexo Camos"
- date: "2026-07-11"
- type: "rastrexo"
- location: "Campos, Nigrán"
- organizers: `Rastrexo Camos`
- organization Facebook: `https://www.facebook.com/profile.php?id=100057577212657`
- source_url: URL of the original event post, if available
- image_url: `https://example.com/poster.jpg`

Result:
- Reuse or create organization slug: `rastrexo-camos`
- Filename: `calendarios/2026/ix-rastrexo-camos.njk`
- Image: `recursos/imaxes/2026/ix-camos.jpg`
- Frontmatter organizer: `rastrexo-camos`
- Frontmatter image field: `2026/ix-camos.jpg`
