"use strict";

const fs = require("node:fs");
const path = require("node:path");

const outputRoot = path.resolve(__dirname, "..", "_site");
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
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

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const relativeFile = path.relative(outputRoot, htmlFile);

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

if (errors.length > 0) {
  console.error(`A comprobación do build atopou ${errors.length} erro(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Build verificado: ${htmlFiles.length} páxinas HTML e ${files.length} ficheiros.`);
