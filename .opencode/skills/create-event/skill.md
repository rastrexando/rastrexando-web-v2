# Create Event Skill

This skill creates new rastrexos (treasure hunts) or andainas (walking events) for the Rastrexando site.

## Required Information

Collect from the user:
- **title**: Event name (e.g., "IX Rastrexo Camos")
- **date**: Event date (YYYY-MM-DD format)
- **type**: Either "rastrexo" or "andaina"
- **location**: City and province (e.g., "Campos, Nigrán")
- **source_url**: Facebook page or website URL
- **source_name**: Organizer name
- **image_url**: URL to download the event poster/image from
- **body** (optional): HTML content for the event description. See "Body text rules" below.
- **videos** (optional): Array of YouTube video objects with `id` and `title`
- **registration_email** (optional): Email address where participants can register. When provided, a registration button will appear automatically on the event page for future events. The email address is obfuscated in the HTML to avoid spam bots.

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

### 6. Create the event file

Create `calendarios/<year>/<slug>.njk` with this template:

```njk
---
layout: post
tags: ["post", "<year>", "<type>"]
title: "<title>"
date: <YYYY-MM-DD>
source_url: <source_url>
source_name: "<source_name>"
location: "<location>"
image: <year>/<image-filename>
registration_email: <registration_email>
---

<optional body HTML>
```

If `registration_email` is not provided, omit that line from the frontmatter.

If videos are provided, add them to the frontmatter:

```yaml
videos:
  - id: <youtube-video-id>
    title: "<video title>"
```

### 7. Verify the build

Run `npx @11ty/eleventy` to ensure the site builds without errors.

## Example

User provides:
- title: "IX Rastrexo Camos"
- date: "2026-07-11"
- type: "rastrexo"
- location: "Campos, Nigrán"
- source_url: "https://www.facebook.com/profile.php?id=100057577212657"
- source_name: "Rastrexo Camos"
- image_url: "https://example.com/poster.jpg"

Result:
- Filename: `calendarios/2026/ix-rastrexo-camos.njk`
- Image: `recursos/imaxes/2026/ix-camos.jpg`
- Frontmatter image field: `2026/ix-camos.jpg`
