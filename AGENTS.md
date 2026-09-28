# Rastrexando Web V2

## Overview
- Eleventy static site, Galician language
- Catalogs "rastrexos" (treasure hunts) and "andainas" (walking events) across Galicia
- Dev: `npx @11ty/eleventy --serve`
- Build: `npx @11ty/eleventy`

## Structure
- `calendarios/<year>/<slug>.njk` — event files
- `recursos/imaxes/<year>/` — event images
- `_includes/layouts/` — Nunjucks layouts (post, base, calendar, skeleton)
- `_data/` — site data (years.json, site.js)
- `.eleventy.js` — config (filters, collections, shortcodes)

## Event Frontmatter
```yaml
layout: post
tags: ["post", "<year>", "<rastrexo|andaina|orientacion|outro>"]
title: "<event title>"
date: <YYYY-MM-DD>
organizers:
  - <organization-slug>
source_url: <optional original announcement or registration URL>
location: "<city>, <municipality>"
province: "<optional province>"
map_lat: <optional approximate latitude>
map_lng: <optional approximate longitude>
image: <year>/<image-filename>
```

Approximate coordinates and province are resolved from `_data/locations.json` when the `location` text matches an entry. Use front matter fields only to override a catalogue entry. Catalogue coordinates represent the locality centre or general event area; never replace them with exact coordinates printed on a poster or assume those coordinates are a departure point.

For a new location, first run `npm run geocode -- "<location>"`. Validate the candidate manually, then add it with `npm run geocode -- "<location>" --add --lat <latitude> --lng <longitude> --province <province>`. The script never writes during lookup and must not be run in batches or in parallel, in accordance with Nominatim usage limits.

When a poster contains a QR code, decode and validate it. Add useful, publicly available event-specific destinations directly to the event page so visitors do not need to scan the poster themselves. Do not publish destinations that return errors or are not public yet; preserve the poster's QR instruction and revisit the URL later. Classify ambiguous related activities as `outro` rather than defaulting to `rastrexo`.

Organizations are stored in `_data/organizations.json` and referenced by stable slugs in the `organizers` array. Reuse an existing organization before creating one. Only assign an organizer when the source explicitly identifies it as responsible for the event; do not infer it from the venue, locality, prior editions, the account sharing a post, or collaborator logos. When no organizer is confirmed, omit `organizers` and preserve the announcement as `source_url`. Organization profile URLs belong in the organization entity; `source_url` is reserved for an event-specific original announcement, registration page, or other direct source. Historical events may still use `source_name` and `source_url` as a compatibility fallback.

Organization avatars use a local `logo` path under `recursos/imaxes/organizacions/` plus an official HTTP(S) `logo_source`. The logo filename must match the organization slug. Do not hotlink remote images or use event posters as organization logos. Organizations without a verified logo automatically receive deterministic initials and colors generated from their name and slug.

```yaml
videos: # optional
  - id: <youtube-video-id>
    title: "<video title>"
    published: <YYYY-MM-DD upload date>
    channel: "<YouTube channel name>"

notices: # optional; rendered between event information and the map
  - date: <YYYY-MM-DD>
    message: "<notice text>"
```

Video `channel` is required and identifies the YouTube publisher, whether it is an organization, team, or individual; it must not be inferred from the event organizers. `published` is also required and must contain the real YouTube publication date. Videos are ordered by `published`, and displayed publication dates always include the year. The home page features the three most recently published videos regardless of event year. The full catalogue lives at `/videos/`, supports client-side filtering by channel, organization, and event year, and organization profiles list videos from their events.

Compilations and other videos that cannot be assigned to exactly one event belong in `_data/standalone-videos.json`, using the same `id`, `title`, `published`, and `channel` fields. Standalone videos appear in the main catalogue and latest-video ordering but have no event year, organization association, or event detail link. Never duplicate one YouTube ID across multiple events; use a standalone entry for multi-event videos.

## Conventions
- Filenames: lowercase, hyphenated, preserve Roman numerals (e.g., `ix-rastrexo-camos.njk`)
- Images stored in `recursos/imaxes/<year>/` and referenced as `<year>/filename.ext`
- Tags must include: "post", year, and type (`rastrexo`, `andaina`, `orientacion`, or `outro`)
- Year directories must exist in both `calendarios/` and `recursos/imaxes/`
- Year must be listed in `_data/years.json`

## Skills
- [Create Event](.opencode/skills/create-event/skill.md) — create new rastrexos/andainas
