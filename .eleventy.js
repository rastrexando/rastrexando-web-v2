module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('base', 'layouts/base.njk');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');
  eleventyConfig.addLayoutAlias('calendar', 'layouts/calendar.njk');
	eleventyConfig.addPassthroughCopy("recursos/");
	eleventyConfig.addPassthroughCopy("CNAME");
};
