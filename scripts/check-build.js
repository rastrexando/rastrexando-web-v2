"use strict";

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(projectRoot, "_site");
const siteUrl = "https://rastrexando.eu";
const legacyCamosUrl = `${siteUrl}/calendarios/2026/IX-rastrexo-camos/`;
const canonicalCamosUrl = `${siteUrl}/calendarios/2026/ix-rastrexo-camos/`;
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function filesShareInode(firstPath, secondPath) {
  if (!firstPath || !secondPath || !fs.existsSync(firstPath) || !fs.existsSync(secondPath)) return false;

  const firstStat = fs.statSync(firstPath);
  const secondStat = fs.statSync(secondPath);
  return firstStat.dev === secondStat.dev && firstStat.ino === secondStat.ino;
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function outputPathForUrl(urlPath) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const relativePath = decodedPath.replace(/^\/+/, "");
  const candidate = path.join(outputRoot, relativePath);
  return decodedPath.endsWith("/") ? path.join(candidate, "index.html") : candidate;
}

function urlForOutputPath(file) {
  const relativePath = path.relative(outputRoot, file).split(path.sep).join("/");

  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) {
    return `/${relativePath.slice(0, -"index.html".length)}`;
  }

  return `/${relativePath}`;
}

const files = walk(outputRoot);
const htmlFiles = files.filter((file) => file.endsWith(".html"));

check(fs.existsSync(path.join(outputRoot, "index.html")), "Falta a páxina de inicio");
check(fs.existsSync(path.join(outputRoot, "robots.txt")), "Falta robots.txt");
check(fs.existsSync(path.join(outputRoot, "sitemap.txt")), "Falta sitemap.txt");
check(htmlFiles.length >= 250, `Só se xeraron ${htmlFiles.length} páxinas HTML`);
check(!fs.existsSync(path.join(outputRoot, "AGENTS", "index.html")), "Publicouse AGENTS.md");
check(!fs.existsSync(path.join(outputRoot, "CORRECCIONS", "index.html")), "Publicouse CORRECCIONS.md");
check(!fs.existsSync(path.join(outputRoot, ".opencode")), "Publicouse o directorio .opencode");

const robotsPath = path.join(outputRoot, "robots.txt");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  const sitemapMatch = robots.match(/^Sitemap:\s+https?:\/\/[^/]+(\/\S+)$/m);
  check(Boolean(sitemapMatch), "robots.txt non declara un sitemap válido");
  if (sitemapMatch) {
    check(
      fs.existsSync(outputPathForUrl(sitemapMatch[1])),
      `O sitemap de robots.txt non existe: ${sitemapMatch[1]}`
    );
  }
}

const sitemapPath = path.join(outputRoot, "sitemap.txt");
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  check(!sitemap.includes(legacyCamosUrl), "O sitemap inclúe a URL antiga de Camos con maiúsculas");
  check(sitemap.includes(canonicalCamosUrl), "O sitemap non inclúe a URL canónica de Camos");
}

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const relativeFile = path.relative(outputRoot, htmlFile);
  const isSitePage = !relativeFile.startsWith(`recursos${path.sep}`);
  const canonicalMatches = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)];

  if (isSitePage) {
    check(
      canonicalMatches.length === 1,
      `${relativeFile}: debe conter exactamente un canonical (atopáronse ${canonicalMatches.length})`
    );
  }

  if (isSitePage && canonicalMatches.length === 1) {
    const canonicalUrl = canonicalMatches[0][1];
    const isHtmlRedirect = /<meta\s+[^>]*http-equiv="refresh"/i.test(html);
    let parsedCanonical;

    try {
      parsedCanonical = new URL(canonicalUrl);
    } catch {
      check(false, `${relativeFile}: canonical non é unha URL absoluta válida (${canonicalUrl})`);
    }

    if (parsedCanonical) {
      check(parsedCanonical.origin === siteUrl, `${relativeFile}: canonical usa outro dominio (${canonicalUrl})`);

      if (isHtmlRedirect) {
        const target = outputPathForUrl(parsedCanonical.pathname);
        check(target && fs.existsSync(target), `${relativeFile}: canonical apunta a unha páxina inexistente (${canonicalUrl})`);
      } else {
        const expectedCanonical = `${siteUrl}${urlForOutputPath(htmlFile)}`;
        const canonicalOutputPath = outputPathForUrl(parsedCanonical.pathname);
        const isCaseInsensitiveCollision =
          canonicalUrl.toLowerCase() === expectedCanonical.toLowerCase() &&
          filesShareInode(canonicalOutputPath, htmlFile);

        check(
          canonicalUrl === expectedCanonical || isCaseInsensitiveCollision,
          `${relativeFile}: canonical incorrecto (${canonicalUrl}; esperado ${expectedCanonical})`
        );
      }
    }
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${relativeFile}: JSON-LD non válido (${error.message})`);
    }
  }

  for (const match of html.matchAll(/"startDate":\s*"([^"]+)"/g)) {
    check(
      /^\d{4}-\d{2}-\d{2}$/.test(match[1]),
      `${relativeFile}: startDate non usa YYYY-MM-DD (${match[1]})`
    );
  }

  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const localUrl = match[1].split(/[?#]/, 1)[0];
    if (!localUrl || localUrl.startsWith("//")) continue;

    const target = outputPathForUrl(localUrl);
    check(target && fs.existsSync(target), `${relativeFile}: referencia local rota ${localUrl}`);
  }
}

const legacyCamosPath = outputPathForUrl(new URL(legacyCamosUrl).pathname);
const canonicalCamosPath = outputPathForUrl(new URL(canonicalCamosUrl).pathname);
const legacyRedirectTemplate = path.join(
  projectRoot,
  "calendarios",
  "2026",
  "ix-rastrexo-camos-uppercase-redirect.njk"
);

if (legacyCamosPath && fs.existsSync(legacyCamosPath)) {
  const legacyCamosHtml = fs.readFileSync(legacyCamosPath, "utf8");
  check(
    legacyCamosHtml.includes(`<link rel="canonical" href="${canonicalCamosUrl}">`),
    "A URL antiga de Camos non apunta á URL canónica en minúsculas"
  );

  const outputsCollide = filesShareInode(legacyCamosPath, canonicalCamosPath);

  if (!outputsCollide) {
    check(/<meta\s+[^>]*http-equiv="refresh"/i.test(legacyCamosHtml), "A URL antiga de Camos non redirixe");
  }
} else {
  check(false, "Falta a páxina de compatibilidade da URL antiga de Camos");
}

if (fs.existsSync(legacyRedirectTemplate)) {
  const redirectSource = fs.readFileSync(legacyRedirectTemplate, "utf8");
  check(/<meta\s+[^>]*http-equiv="refresh"/i.test(redirectSource), "O redirect fonte de Camos non usa meta refresh");
  check(
    redirectSource.includes(`<link rel="canonical" href="${canonicalCamosUrl}">`),
    "O redirect fonte de Camos non declara a URL canónica en minúsculas"
  );
} else {
  check(false, "Falta o redirect fonte da URL antiga de Camos");
}

if (errors.length > 0) {
  console.error(`A comprobación do build atopou ${errors.length} erro(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Build verificado: ${htmlFiles.length} páxinas HTML e ${files.length} ficheiros.`);
