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
source_url: <facebook or website url>
source_name: "<organizer name>"
location: "<city>, <municipality>"
province: "<optional province>"
map_lat: <optional approximate latitude>
map_lng: <optional approximate longitude>
image: <year>/<image-filename>
```

Approximate coordinates and province are resolved from `_data/locations.json` when the `location` text matches an entry. Use front matter fields only to override a catalogue entry.

For a new location, first run `npm run geocode -- "<location>"`. Validate the candidate manually, then add it with `npm run geocode -- "<location>" --add --lat <latitude> --lng <longitude> --province <province>`. The script never writes during lookup and must not be run in batches or in parallel, in accordance with Nominatim usage limits.

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
