const path = require("node:path");
const Image = require("@11ty/eleventy-img").default;

async function createImageVariant(image, width, folder, quality = 76) {
  const originalUrl = `/recursos/imaxes/${image}`;
  try {
    const metadata = await Image(
      path.join(__dirname, "recursos", "imaxes", image),
      {
        widths: [width],
        formats: ["webp"],
        outputDir: path.join(__dirname, "_site", "recursos", "imaxes", folder),
        urlPath: `/recursos/imaxes/${folder}/`,
        outputOptions: { webp: { quality } }
      }
    );
    return metadata.webp[0].url;
  } catch (error) {
    console.warn(`Non se puido optimizar ${image}: ${error.message}`);
    return originalUrl;
  }
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addLayoutAlias("skeleton", "layouts/skeleton.njk");
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addLayoutAlias("calendar", "layouts/calendar.njk");
  eleventyConfig.addPassthroughCopy("recursos/");
  eleventyConfig.addPassthroughCopy({
    "node_modules/leaflet/dist": "recursos/vendor/leaflet"
  });
  eleventyConfig.addPassthroughCopy({
    "node_modules/leaflet.markercluster/dist": "recursos/vendor/leaflet.markercluster"
  });
  eleventyConfig.addPassthroughCopy("CNAME");

  /* Filters */
  eleventyConfig.addFilter("toGlLocale", function(value) {
    if (value) {
      return value.toLocaleDateString("gl", {weekday: "long", year: "numeric", month: "long", day: "numeric"})
    }
    return ""
  });

  eleventyConfig.addFilter("toGLMonthDay", function(value) {
    if (value) {
      return value.toLocaleDateString("gl", {month: "short", day: "numeric"})
    }
    return ""
  });

  eleventyConfig.addFilter("toGLWeekday", function(value) {
    return value ? value.toLocaleDateString("gl", { weekday: "long" }) : "";
  });

  eleventyConfig.addFilter("toGLDay", function(value) {
    return value ? value.toLocaleDateString("gl", { day: "numeric" }) : "";
  });

  eleventyConfig.addFilter("toGLMonthYear", function(value) {
    return value ? value.toLocaleDateString("gl", { month: "long", year: "numeric" }) : "";
  });

  eleventyConfig.addFilter("toRelativeDate", function(date) {
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoxe";
    if (diffDays === 1) return "Mañá";
    if (diffDays > 1 && diffDays < 30) return `En ${diffDays} días`;
    if (diffDays >= 30 && diffDays < 60) return "Nun mes";
    if (diffDays >= 60 && diffDays < 365) return `En ${Math.round(diffDays / 30)} meses`;
    return "";
  });

  eleventyConfig.addFilter("toISODate", function (dateVal) {
    return new Date(dateVal).toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("toNumericDate", function (dateVal) {
    return new Date(dateVal).toISOString().slice(0, 10).split("-").reverse().join("-");
  });

  eleventyConfig.addFilter("groupEventsByMonth", function (events) {
    const today = new Date();
    const groups = [];

    for (const event of events || []) {
      const eventDate = event.data.date;
      const monthIndex = eventDate.getMonth();
      let group = groups.find(item => item.monthIndex === monthIndex);

      if (!group) {
        group = {
          monthIndex,
          id: `mes-${monthIndex + 1}`,
          name: eventDate.toLocaleDateString("gl", { month: "long" }),
          isCurrent: eventDate.getFullYear() === today.getFullYear() && monthIndex === today.getMonth(),
          events: []
        };
        groups.push(group);
      }

      group.events.push(event);
    }

    return groups;
  });

  eleventyConfig.addFilter("findYearCover", function (covers, year) {
    return (covers || []).find(item => String(item.year) === String(year));
  });

  eleventyConfig.addFilter("resolveOrganizations", function (slugs, organizations) {
    const requestedSlugs = Array.isArray(slugs) ? slugs : (slugs ? [slugs] : []);
    const organizationsBySlug = new Map(
      (organizations || []).map(organization => [organization.slug, organization])
    );

    return requestedSlugs
      .map(slug => organizationsBySlug.get(slug))
      .filter(Boolean);
  });

  eleventyConfig.addFilter("organizationPrimaryUrl", function (organization) {
    return organization?.links?.website ||
      organization?.links?.instagram ||
      organization?.links?.facebook ||
      "";
  });

  eleventyConfig.addFilter("eventsForOrganization", function (events, organizationSlug) {
    return (events || [])
      .filter(event => Array.isArray(event.data.organizers) && event.data.organizers.includes(organizationSlug))
      .slice()
      .sort((first, second) => second.data.date - first.data.date);
  });

  eleventyConfig.addFilter("relatedOrganizationEvents", function (events, organizationSlugs, currentUrl) {
    const requestedSlugs = new Set(
      Array.isArray(organizationSlugs) ? organizationSlugs : (organizationSlugs ? [organizationSlugs] : [])
    );

    if (requestedSlugs.size === 0) return [];

    return (events || [])
      .filter(event => event.url !== currentUrl)
      .filter(event => Array.isArray(event.data.organizers) &&
        event.data.organizers.some(slug => requestedSlugs.has(slug)))
      .slice()
      .sort((first, second) => second.data.date - first.data.date)
      .slice(0, 3);
  });

  eleventyConfig.addFilter("mapEmbedUrl", function (latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";

    const latOffset = 0.012;
    const lonOffset = 0.018;
    const bbox = [
      (lon - lonOffset).toFixed(6),
      (lat - latOffset).toFixed(6),
      (lon + lonOffset).toFixed(6),
      (lat + latOffset).toFixed(6)
    ].join("%2C");

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lon.toFixed(6)}`;
  });

  eleventyConfig.addFilter("mapLinkUrl", function (latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";

    return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=14/${lat.toFixed(6)}/${lon.toFixed(6)}`;
  });

  eleventyConfig.addFilter("geoUrl", function (latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";

    const coordinates = `${lat.toFixed(6)},${lon.toFixed(6)}`;
    return `geo:${coordinates}?q=${coordinates}`;
  });

  /* Collections */
  const now = new Date();

  eleventyConfig.addCollection("featured", function (collectionApi) {
    return collectionApi.getAllSorted().reverse().filter(function(item) {
      return item.data.date > now && item.data.tags.includes("post")
    })
  });

  eleventyConfig.addCollection("currentYearVideos", function (collectionApi) {
    const currentYear = String(now.getFullYear());
    const videos = collectionApi.getAllSorted()
      .filter(function(item) {
        return item.data.tags?.includes("post") &&
               item.data.tags.includes(currentYear) &&
               Array.isArray(item.data.videos);
      })
      .flatMap(function(item) {
        return item.data.videos.map(function(video) {
          const publishedDate = video.published ? new Date(video.published) : item.data.date;
          return {
            id: video.id,
            title: video.title,
            channel: video.channel || "",
            publishedDate,
            eventTitle: item.data.title,
            eventUrl: item.url,
            eventDate: item.data.date,
            location: item.data.location
          };
        });
      })
      .filter(function(video) {
        return video.id && video.title && !Number.isNaN(video.publishedDate.getTime());
      })
      .sort(function(first, second) {
        return second.publishedDate - first.publishedDate;
      });

    return videos.slice(0, 3);
  });

  eleventyConfig.addCollection("yearCovers", function(collectionApi) {
    const years = require("./_data/years.json");
    const coverImages = require("./_data/yearCoverImages.json");
    const all = collectionApi.getAllSorted();
    return years.map(function(y) {
      const posts = all.filter(function(item) {
        return item.data.tags &&
               item.data.tags.includes("post") &&
               item.data.tags.includes(String(y.name));
      });
      return {
        year: y.name,
        image: coverImages[String(y.name)] || null,
        count: posts.length,
        url: "/calendarios/" + y.name + "/"
      };
    });
  });

  /* Short codes */
  eleventyConfig.addShortcode("renderCalendarMap", function(events, locations, year) {
    const groupedLocations = new Map();

    for (const event of events || []) {
      const eventLocation = locations?.[event.data.location] || {};
      const latitude = Number(event.data.map_lat ?? eventLocation.lat);
      const longitude = Number(event.data.map_lng ?? eventLocation.lng);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
      let group = groupedLocations.get(key);

      if (!group) {
        group = {
          name: event.data.location || "Localización aproximada",
          lat: latitude,
          lng: longitude,
          events: []
        };
        groupedLocations.set(key, group);
      }

      group.events.push({
        title: event.data.title,
        date: event.data.date.toISOString().slice(0, 10),
        url: event.url
      });
    }

    const mapData = {
      year: String(year),
      locations: Array.from(groupedLocations.values()).map((group) => ({
        ...group,
        events: group.events.sort((first, second) => first.date.localeCompare(second.date))
      }))
    };
    const serializedData = JSON.stringify(mapData)
      .replaceAll("<", "\\u003c")
      .replaceAll("\u2028", "\\u2028")
      .replaceAll("\u2029", "\\u2029");
    const mapId = `calendar-map-${String(year).replace(/[^0-9A-Za-z_-]/g, "-")}`;

    return `
      <section class="calendar-map-card" data-calendar-map aria-labelledby="${mapId}-title">
        <div class="calendar-map-heading">
          <div>
            <span class="calendar-map-eyebrow">Localizacións aproximadas</span>
            <h2 id="${mapId}-title">Mapa de eventos de ${year}</h2>
          </div>
          <p class="calendar-map-summary" data-map-summary aria-live="polite"></p>
        </div>
        <div
          id="${mapId}"
          class="calendar-map-canvas"
          data-map-canvas
          role="region"
          aria-label="Mapa interactivo dos eventos de ${year}"
        ></div>
        <p class="calendar-map-empty" data-map-empty hidden>Non hai eventos con localización dispoñible neste calendario.</p>
        <div class="calendar-map-legend" aria-label="Lenda do mapa">
          <span class="calendar-map-legend-title">Lenda:</span>
          <span><i class="calendar-map-key calendar-map-key--upcoming" aria-hidden="true">P</i> Hoxe ou próximos</span>
          <span><i class="calendar-map-key calendar-map-key--past" aria-hidden="true">✓</i> Pasados</span>
          <span><i class="calendar-map-key calendar-map-key--mixed" aria-hidden="true">±</i> Mixtos</span>
        </div>
        <p class="calendar-map-notice">As localizacións son aproximadas. Amplía os grupos e selecciona un marcador para ver os eventos.</p>
        <script type="application/json" data-calendar-map-data>${serializedData}</script>
      </section>
    `;
  });

  eleventyConfig.addShortcode("renderHTMXLink", function(href, title, classes="") {
    return `
      <a
        href="${href}"
        hx-get="${href}"
        hx-target="#main-container"
        hx-select="#main-container"
        hx-swap="outerHTML"
        hx-push-url="true"
        title="${title}"
        class="${classes}"
      >
        ${title}
      </a>
    `
  })

  eleventyConfig.addShortcode("renderPrevNextButtons", function (pagination, title) {
    let prev = "<div class='not-allowed'>← Anterior</div>"
    if (pagination.href.previous) {
      prev = `
        <a
          href="${pagination.href.previous}"
          hx-get="${pagination.href.previous}"
          hx-push-url="true"
          hx-target="#main-container"
          hx-select="#main-container"
          hx-swap="outerHTML"
        >← Anterior</a>
      `
    }

    let next = "<div class='not-allowed'>Seguinte →</div>"
    if (pagination.href.next) {
      next =`
        <a
          href="${pagination.href.next}"
          hx-get="${pagination.href.next}"
          hx-target="#main-container"
          hx-select="#main-container"
          hx-swap="outerHTML"
          hx-push-url="true"
        >Seguinte →</a>
      `
    }

    return `
      <div class="prev-next-buttons">
        ${prev}
        ${next}
      </div>
    `;
  })

  eleventyConfig.addShortcode("renderNotice", function (date, message) {
    const [year, month, day] = date.split("-");
    const formattedDate = `${day}-${month}-${year}`;
    return `<p class="event-notice"><i class="fi-alert" aria-hidden="true"></i><span class="event-notice-content"><strong><time datetime="${date}">${formattedDate}</time>:</strong> ${message}</span></p>`;
  })

  eleventyConfig.addAsyncShortcode("renderYearHero", async function (cover) {
    if (!cover) return "";
    const imageUrl = cover.image
      ? await createImageVariant(cover.image, 1200, "cabeceiras", 78)
      : "";
    const style = imageUrl ? ` style="--year-hero-img: url('${imageUrl}')"` : "";
    const eventLabel = cover.count === 1 ? "evento" : "eventos";

    return `
      <header class="year-hero${imageUrl ? "" : " no-image"}"${style}>
        <span class="year-hero-eyebrow">Calendario</span>
        <h1>${cover.year}</h1>
        <span class="year-hero-count">${cover.count} ${eventLabel}</span>
      </header>
    `;
  });

  eleventyConfig.addAsyncShortcode("renderActiveYearCard", async function (cover) {
    if (!cover) return "";
    const imageUrl = cover.image
      ? await createImageVariant(cover.image, 1200, "cabeceiras", 78)
      : "";
    const style = imageUrl ? ` style="--cover-img: url('${imageUrl}')"` : "";
    const eventLabel = cover.count === 1 ? "evento" : "eventos";

    return `
      <a
        class="active-year-card${imageUrl ? "" : " no-image"}"
        href="${cover.url}"
        hx-get="${cover.url}"
        hx-target="#main-container"
        hx-select="#main-container"
        hx-swap="outerHTML"
        hx-push-url="true"${style}
      >
        <span class="active-year-number">${cover.year}</span>
        <span class="active-year-count">${cover.count} ${eventLabel}</span>
      </a>
    `;
  });

  eleventyConfig.addAsyncShortcode("renderYearCoverItem", async function (cover) {
    if (!cover) return "";
    const imageUrl = cover.image
      ? await createImageVariant(cover.image, 400, "portadas-ano", 74)
      : "";
    const style = imageUrl ? ` style="--cover-img: url('${imageUrl}')"` : "";
    const eventLabel = cover.count === 1 ? "evento" : "eventos";

    return `
      <a
        class="year-cover-item${imageUrl ? "" : " no-image"}"
        href="${cover.url}"
        hx-get="${cover.url}"
        hx-target="#main-container"
        hx-select="#main-container"
        hx-swap="outerHTML"
        hx-push-url="true"${style}
      >
        <span class="year-cover-label">${cover.year} <small>${cover.count} ${eventLabel}</small></span>
      </a>
    `;
  });

  eleventyConfig.addAsyncShortcode("renderPost", async function (post, organizations = []) {
    const date = post.data.date;
    const day = date.toLocaleDateString("gl", { day: "numeric" });
    const month = date.toLocaleDateString("gl", { month: "short" });

    const tags = post.data.tags || [];
    const isAndaina = tags.includes("andaina");
    const isOrientacion = tags.includes("orientacion");
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const typeLabel = isAndaina ? "Andaina" : isOrientacion ? "Orientación" : "Rastrexo";
    const typeClass = isAndaina ? "andaina" : isOrientacion ? "orientacion" : "rastrexo";
    const typePill = `<span class="type-pill ${typeClass}">${typeLabel}</span>`;

    let relativeLabel = "";
    if (diffDays === 0) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">Hoxe</span>`;
    } else if (diffDays === 1) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">Mañá</span>`;
    } else if (diffDays > 1 && diffDays < 30) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">En ${diffDays} días</span>`;
    } else if (diffDays >= 30 && diffDays < 60) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">Nun mes</span>`;
    } else if (diffDays >= 60 && diffDays < 365) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">En ${Math.round(diffDays / 30)} meses</span>`;
    }

    const locationHTML = post.data.location
      ? `<span class="post-card-location"><i class="fi-marker"></i> ${post.data.location}</span>`
      : "";

    const organizationsBySlug = new Map(
      (organizations || []).map(organization => [organization.slug, organization])
    );
    const eventOrganizations = (post.data.organizers || [])
      .map(slug => organizationsBySlug.get(slug))
      .filter(Boolean);
    const organizationNames = eventOrganizations.map(organization => organization.name).join(", ");
    const sourceIcon = post.data.source_url?.includes("instagram.com")
      ? "fi-social-instagram"
      : "fi-social-facebook";
    const sourceHTML = organizationNames
      ? `<span class="post-card-source"><i class="fi-home"></i> ${organizationNames}</span>`
      : (post.data.source_url
        ? `<span class="post-card-source"><i class="${sourceIcon}"></i> ${post.data.source_name}</span>`
        : (post.data.source_name ? `<span class="post-card-source">${post.data.source_name}</span>` : ""));

    let thumbnailUrl = "";
    if (post.data.image) {
      const originalUrl = `/recursos/imaxes/${post.data.image}`;
      try {
        const metadata = await Image(
          path.join(__dirname, "recursos", "imaxes", post.data.image),
          {
            widths: [208],
            formats: ["webp"],
            outputDir: path.join(__dirname, "_site", "recursos", "imaxes", "miniaturas"),
            urlPath: "/recursos/imaxes/miniaturas/",
            outputOptions: {
              webp: { quality: 72 }
            }
          }
        );
        thumbnailUrl = metadata.webp[0].url;
      } catch (error) {
        console.warn(`Non se puido crear a miniatura de ${post.data.image}: ${error.message}`);
        thumbnailUrl = originalUrl;
      }
    }

    const mediaHTML = post.data.image
      ? `<div class="post-card-media"><img class="post-card-image" src="${thumbnailUrl}" alt="" loading="lazy" decoding="async">${typePill}</div>`
      : `<div class="post-card-media post-card-media--fallback"><span class="day">${day}</span><span class="month">${month}</span>${typePill}</div>`;

    const fullDate = date.toLocaleDateString("gl", { day: "numeric", month: "long", year: "numeric" });

    return `
    <article class="post">
      <a
        class="post-card post-card--${typeClass}${post.data.image ? " post-card--has-image" : ""}"
        hx-get="${post.url}"
        hx-target="#main-container"
        hx-select="#main-container"
        hx-swap="outerHTML"
        hx-push-url="true"
        href="${post.url}"
      >
        ${mediaHTML}
        <div class="post-card-body">
          <div class="post-card-date-line">
            <span><i class="fi-calendar"></i> ${fullDate}</span>
            ${relativeLabel}
          </div>
          <p class="post-card-title">${post.data.title}</p>
          <div class="post-card-meta">
            ${locationHTML}
            ${sourceHTML}
          </div>
        </div>
      </a>
    </article>
    `;
  });
};
