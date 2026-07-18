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
location: "<city>, <province>"
image: <year>/<image-filename>
videos: # optional
  - id: <youtube-video-id>
    title: "<video title>"
```

## Conventions
- Filenames: lowercase, hyphenated, preserve Roman numerals (e.g., `ix-rastrexo-camos.njk`)
- Images stored in `recursos/imaxes/<year>/` and referenced as `<year>/filename.ext`
- Tags must include: "post", year, and type ("rastrexo" or "andaina")
- Year directories must exist in both `calendarios/` and `recursos/imaxes/`
- Year must be listed in `_data/years.json`

## Skills
- [Create Event](.opencode/skills/create-event/skill.md) — create new rastrexos/andainas
