module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('base', 'layouts/base.njk');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');
	eleventyConfig.addPassthroughCopy("recursos/");
	eleventyConfig.addPassthroughCopy("CNAME");
};
