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
tags: ["post", "<year>", "<rastrexo|andaina>"]
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

Approximate coordinates and province are resolved from `_data/locations.json` when the `location` text matches an entry. Use front matter fields only to override a catalogue entry.

For a new location, first run `npm run geocode -- "<location>"`. Validate the candidate manually, then add it with `npm run geocode -- "<location>" --add --lat <latitude> --lng <longitude> --province <province>`. The script never writes during lookup and must not be run in batches or in parallel, in accordance with Nominatim usage limits.

Organizations are stored in `_data/organizations.json` and referenced by stable slugs in the `organizers` array. Reuse an existing organization before creating one. Organization profile URLs belong in the organization entity; `source_url` is reserved for an event-specific original announcement, registration page, or other direct source. Historical events may still use `source_name` and `source_url` as a compatibility fallback.

Organization avatars use a local `logo` path under `recursos/imaxes/organizacions/` plus an official HTTP(S) `logo_source`. The logo filename must match the organization slug. Do not hotlink remote images or use event posters as organization logos. Organizations without a verified logo automatically receive deterministic initials and colors generated from their name and slug.

```yaml
videos: # optional
  - id: <youtube-video-id>
    title: "<video title>"
    published: <optional YYYY-MM-DD upload date>
    channel: "<optional channel name>"

notices: # optional; rendered between event information and the map
  - date: <YYYY-MM-DD>
    message: "<notice text>"
```

Video `published` and `channel` fields are optional for compatibility with historical entries. The home page only features videos attached to events from the current build year, ordered by `published` with the event date as fallback.

## Conventions
- Filenames: lowercase, hyphenated, preserve Roman numerals (e.g., `ix-rastrexo-camos.njk`)
- Images stored in `recursos/imaxes/<year>/` and referenced as `<year>/filename.ext`
- Tags must include: "post", year, and type ("rastrexo" or "andaina")
- Year directories must exist in both `calendarios/` and `recursos/imaxes/`
- Year must be listed in `_data/years.json`

## Skills
- [Create Event](.opencode/skills/create-event/skill.md) — create new rastrexos/andainas
