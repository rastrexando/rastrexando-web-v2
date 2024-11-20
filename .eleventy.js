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

  eleventyConfig.addFilter("dateOnly", function (dateVal, locale = "en-us") {
    var theDate = new Date(dateVal);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return theDate.toLocaleDateString(locale, options);
  });

  /* Collections */
  const now = new Date();

  eleventyConfig.addCollection("featured", function (collectionApi) {
    const upcoming = collectionApi.getAllSorted().reverse().filter(function(item) {
      // Solo próximos rastrexos
      return item.data.date > now && item.data.tags.includes("post")
    })

    const all = collectionApi.getAllSorted().reverse().filter(function(item) {
      // Solo próximos rastrexos
      return item.data && item.data.tags && item.data.tags.includes("post")
    })

    if (upcoming.length == 0) {
      return all.slice(0, 3)
    }

    return upcoming
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
    let prev = "<div class='not-allowed'>Anterior</div>"
    if (pagination.href.previous) {
      prev = `
        <a
          href="${pagination.href.previous}"
          hx-get="${pagination.href.previous}"
          hx-push-url="true"
          hx-target="#main-container"
          hx-select="#main-container"
          hx-swap="outerHTML"
        >
            Anterior
        </a>
      `
    }

    let next = "<div class='not-allowed'>Seguinte</div>"
    if (pagination.href.next) {
      next =`
        <a
          href="${pagination.href.next}"
          hx-get="${pagination.href.next}"
          hx-target="#main-container"
          hx-select="#main-container"
          hx-swap="outerHTML"
          hx-push-url="true"
        >
          Seguinte
        </a>
      `
    }

    return `
      <div class="prev-next-buttons">
      ${prev}
      <h1>${title}</h1>
      ${next}
      </div>
    `;
  })

  eleventyConfig.addShortcode("renderPost", function (post) {
    const localeDate = post.data.date.toLocaleDateString("gl", {weekday: "long", year: "numeric", month: "long", day: "numeric"});
    let sourceHTML = ""

    if (post.data.source_url) {
        sourceHTML = `<li>
            <i class="fi-social-facebook is-light-blue"></i>
            <a class="link" href="${post.data.source_url}" title="${post.data.source_name}" _blank="true">
            ${post.data.source_name }
            </a>
        </li>`
    }

    return `
    <article class="post">
        <hr />
        <header>
            <a
              class="link"
              hx-get="${post.url}"
              hx-target="#main-container"
              hx-select="#main-container"
              hx-swap="outerHTML"
              hx-push-url="true"
              href="${post.url}"
            >
            <h2>${post.data.title}</h2>
            </a>
            <ul class="details">
            <li>
                <div class="date">
                <i class="fi-calendar is-light-blue"></i>
                ${localeDate}
                </div>
            </li>
            <li>
                <i class="fi-marker is-light-blue"></i>
                ${post.data.location}
            </li>
            ${sourceHTML}
            </ul>
        </header>
    </article>
    `;
  });
};
