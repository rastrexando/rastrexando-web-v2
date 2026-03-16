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
    if (diffDays >= 30 && diffDays < 60) return "En 1 mes";
    if (diffDays >= 60 && diffDays < 365) return `En ${Math.round(diffDays / 30)} meses`;
    return "";
  });

  eleventyConfig.addFilter("dateOnly", function (dateVal, locale = "en-us") {
    var theDate = new Date(dateVal);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return theDate.toLocaleDateString(locale, options);
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
    const all = collectionApi.getAllSorted();
    return years.map(function(y) {
      const post = all.find(function(item) {
        return item.data.tags &&
               item.data.tags.includes("post") &&
               item.data.tags.includes(String(y.name)) &&
               item.data.image;
      });
      return {
        year: y.name,
        image: post ? post.data.image : null,
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

  eleventyConfig.addShortcode("renderPost", function (post) {
    const date = post.data.date;
    const day = date.toLocaleDateString("gl", { day: "numeric" });
    const month = date.toLocaleDateString("gl", { month: "short" });

    const tags = post.data.tags || [];
    const isAndaina = tags.includes("andaina");
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isUpcoming = diffDays > 0;

    const typeLabel = isAndaina ? "Andaina" : "Rastrexo";
    const typeClass = isAndaina ? "andaina" : "rastrexo";
    const typePill = `<span class="type-pill ${typeClass}">${typeLabel}</span>`;

    let relativeLabel = "";
    if (diffDays === 0) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">Hoxe</span>`;
    } else if (diffDays === 1) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">Mañá</span>`;
    } else if (diffDays > 1 && diffDays < 30) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">En ${diffDays} días</span>`;
    } else if (diffDays >= 30 && diffDays < 60) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">En 1 mes</span>`;
    } else if (diffDays >= 60 && diffDays < 365) {
      relativeLabel = `<span class="relative-date" data-date="${date.toISOString()}">En ${Math.round(diffDays / 30)} meses</span>`;
    }

    const locationHTML = post.data.location
      ? `<span><i class="fi-marker is-light-blue"></i> ${post.data.location}</span>`
      : "";

    const sourceHTML = post.data.source_url
      ? `<span><i class="fi-social-facebook is-light-blue"></i> ${post.data.source_name}</span>`
      : (post.data.source_name ? `<span>${post.data.source_name}</span>` : "");

    return `
    <article class="post">
      <a
        class="post-card"
        hx-get="${post.url}"
        hx-target="#main-container"
        hx-select="#main-container"
        hx-swap="outerHTML"
        hx-push-url="true"
        href="${post.url}"
      >
        <div class="post-card-date">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <div class="post-card-body">
          <p class="post-card-title">${post.data.title}</p>
          <div class="post-card-meta">
            ${typePill}
            ${relativeLabel}
            ${locationHTML}
            ${sourceHTML}
          </div>
        </div>
      </a>
    </article>
    `;
  });
};
