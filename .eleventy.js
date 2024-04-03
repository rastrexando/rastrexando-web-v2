module.exports = function (eleventyConfig) {
  eleventyConfig.addLayoutAlias("skeleton", "layouts/skeleton.njk");
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addLayoutAlias("calendar", "layouts/calendar.njk");
  eleventyConfig.addPassthroughCopy("recursos/");
  eleventyConfig.addPassthroughCopy("CNAME");

  /* Collections */
  const now = new Date();

  eleventyConfig.addCollection("upcomingPosts", function (collectionApi) {
    return collectionApi.getAllSorted().reverse().filter(function(item) {
      // Only posts
      return true
      return item.data && item.data.tags && "post" in item.data.tags;
    }).filter(function(item) {
      // Only upcoming
      return item.data.date > now && item.data.tags.includes("post")
    })
  });

  /* Short codes */
  eleventyConfig.addShortcode("renderPrevNextButtons", function (pagination, title) {
    let prev = "<span></span>"
    if (pagination.href.previous) {
      prev = `<a href="${pagination.href.previous}">Anterior</a>`
    }

    let next = "<span></span>"
    if (pagination.href.next) {
      next =`<a href="${pagination.href.next}">Seguinte</a>`
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
        <header>
            <hr />
            <a class="link" href="${post.url}">
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
