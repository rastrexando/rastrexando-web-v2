module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('base', 'layouts/base.njk');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');
	eleventyConfig.addPassthroughCopy("assets/bundle.css");
	eleventyConfig.addPassthroughCopy("assets/rastrexando-circular.png");
	eleventyConfig.addPassthroughCopy("assets/rastrexando-horizontal.png");
	eleventyConfig.addPassthroughCopy("assets/landing.jpg");
	eleventyConfig.addPassthroughCopy("assets/images/");
	eleventyConfig.addPassthroughCopy("assets/foundation-icons/");
	eleventyConfig.addPassthroughCopy("CNAME");
};
