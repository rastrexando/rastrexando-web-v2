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

  /* Collections */
  const now = new Date();

  eleventyConfig.addCollection("featured", function (collectionApi) {
    return collectionApi.getAllSorted().reverse().filter(function(item) {
      return item.data.date > now && item.data.tags.includes("post")
    })
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
    return `<p class="event-notice"><i class="fi-alert"></i> <strong>${formattedDate}:</strong> ${message}</p>`;
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

  eleventyConfig.addAsyncShortcode("renderPost", async function (post) {
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

    const sourceHTML = post.data.source_url
      ? `<span class="post-card-source"><i class="fi-social-facebook"></i> ${post.data.source_name}</span>`
      : (post.data.source_name ? `<span class="post-card-source">${post.data.source_name}</span>` : "");

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
