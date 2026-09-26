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

function calendarMapData(urlPath, label) {
  const file = outputPathForUrl(urlPath);
  check(file && fs.existsSync(file), `${label}: falta a páxina xerada`);
  if (!file || !fs.existsSync(file)) return null;

  const html = fs.readFileSync(file, "utf8");
  const matches = [...html.matchAll(/<script type="application\/json" data-calendar-map-data>([\s\S]*?)<\/script>/g)];
  check(matches.length === 1, `${label}: debe conter exactamente un mapa anual`);
  if (matches.length !== 1) return null;

  try {
    return JSON.parse(matches[0][1]);
  } catch (error) {
    check(false, `${label}: os datos JSON do mapa non son válidos (${error.message})`);
    return null;
  }
}

function checkMapYear(urlPath, expectedYear, label) {
  const data = calendarMapData(urlPath, label);
  if (!data) return null;

  check(data.year === expectedYear, `${label}: o mapa declara o ano ${data.year} en lugar de ${expectedYear}`);
  check(Array.isArray(data.locations), `${label}: locations non é unha lista`);

  const events = Array.isArray(data.locations)
    ? data.locations.flatMap((location) => location.events || [])
    : [];
  check(events.length > 0, `${label}: o mapa non inclúe eventos`);
  for (const event of events) {
    check(event.date.startsWith(`${expectedYear}-`), `${label}: inclúe unha data doutro ano (${event.date})`);
    check(
      event.url.startsWith(`/calendarios/${expectedYear}/`),
      `${label}: inclúe unha URL doutro calendario (${event.url})`
    );
  }

  return { data, events };
}

const files = walk(outputRoot);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const organizations = require(path.join(projectRoot, "_data", "organizations.json"));
const organizationSlugs = new Set();
const organizationNames = new Set();
const organizationCanonicalUrls = new Map();
const organizationLinksBySlug = new Map();
const organizationEventReferences = [];

function normalizeOrganizationName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeExternalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const parameter of [...url.searchParams.keys()]) {
      if (!(url.hostname.endsWith("facebook.com") && url.pathname === "/profile.php" && parameter === "id")) {
        url.searchParams.delete(parameter);
      }
    }
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

for (const organization of organizations) {
  check(Boolean(organization.slug), "Hai unha organización sen slug");
  check(Boolean(organization.name), `A organización ${organization.slug || "sen slug"} non ten nome`);
  check(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(organization.slug || ""),
    `O slug de organización ${organization.slug || "baleiro"} non é válido`
  );
  check(
    !organizationSlugs.has(organization.slug),
    `O slug de organización ${organization.slug} está duplicado`
  );
  organizationSlugs.add(organization.slug);

  const normalizedName = normalizeOrganizationName(organization.name);
  check(
    !organizationNames.has(normalizedName),
    `O nome de organización ${organization.name} está duplicado ou é demasiado semellante`
  );
  organizationNames.add(normalizedName);

  const links = Object.values(organization.links || {});
  organizationLinksBySlug.set(organization.slug, new Set(links.map(normalizeExternalUrl).filter(Boolean)));
  for (const link of links) {
    const normalizedUrl = normalizeExternalUrl(link);
    check(Boolean(normalizedUrl) && /^https?:\/\//.test(link), `${organization.name}: enlace canónico non válido (${link})`);
    if (!normalizedUrl) continue;
    check(
      !organizationCanonicalUrls.has(normalizedUrl),
      `${organization.name}: enlace canónico xa usado por ${organizationCanonicalUrls.get(normalizedUrl)} (${link})`
    );
    organizationCanonicalUrls.set(normalizedUrl, organization.name);
  }
}

const eventTemplateFiles = walk(path.join(projectRoot, "calendarios"))
  .filter((file) => file.endsWith(".njk"));
for (const eventTemplateFile of eventTemplateFiles) {
  const source = fs.readFileSync(eventTemplateFile, "utf8");
  const relativeEventTemplate = path.relative(projectRoot, eventTemplateFile);
  const organizerBlock = source.match(/^organizers:\s*\n((?:[ \t]+-[^\n]*\n?)+)/m);
  const organizerReferences = organizerBlock
    ? [...organizerBlock[1].matchAll(/^\s+-\s+([a-z0-9-]+)\s*$/gm)].map(match => match[1])
    : [];

  for (const organizationSlug of organizerReferences) {
    check(
      organizationSlugs.has(organizationSlug),
      `${relativeEventTemplate}: organización descoñecida ${organizationSlug}`
    );
  }

  if (organizerReferences.length > 0) {
    check(!/^source_name:/m.test(source), `${relativeEventTemplate}: conserva source_name tras a migración`);
    check(!/^source_url:[ \t]*$/m.test(source), `${relativeEventTemplate}: conserva source_url baleiro tras a migración`);
    const sourceUrl = source.match(/^source_url:[ \t]*(\S.*)$/m)?.[1]?.trim();
    const normalizedSourceUrl = normalizeExternalUrl(sourceUrl);
    if (normalizedSourceUrl) {
      for (const organizationSlug of organizerReferences) {
        check(
          !organizationLinksBySlug.get(organizationSlug)?.has(normalizedSourceUrl),
          `${relativeEventTemplate}: source_url duplica o perfil canónico de ${organizationSlug}`
        );
      }
    }

    const eventUrl = `/${relativeEventTemplate.replace(/\\/g, "/").replace(/\.njk$/, "/")}`;
    for (const organizationSlug of organizerReferences) {
      organizationEventReferences.push({ organizationSlug, eventUrl, relativeEventTemplate });
    }
  }

  const is2026Event = eventTemplateFile.includes(`${path.sep}2026${path.sep}`) &&
    /^tags:\s*\[[^\n]*"post"/m.test(source);
  if (is2026Event) {
    check(organizerReferences.length > 0, `${relativeEventTemplate}: falta organizers`);
  }
}

check(fs.existsSync(path.join(outputRoot, "index.html")), "Falta a páxina de inicio");
check(fs.existsSync(path.join(outputRoot, "robots.txt")), "Falta robots.txt");
check(fs.existsSync(path.join(outputRoot, "sitemap.txt")), "Falta sitemap.txt");
check(htmlFiles.length >= 250, `Só se xeraron ${htmlFiles.length} páxinas HTML`);
check(!fs.existsSync(path.join(outputRoot, "AGENTS", "index.html")), "Publicouse AGENTS.md");
check(!fs.existsSync(path.join(outputRoot, "CORRECCIONS", "index.html")), "Publicouse CORRECCIONS.md");
check(!fs.existsSync(path.join(outputRoot, ".opencode")), "Publicouse o directorio .opencode");

const homePath = path.join(outputRoot, "index.html");
if (fs.existsSync(homePath)) {
  const homeHtml = fs.readFileSync(homePath, "utf8");
  check(
    homeHtml.includes('hx-indicator="#global-htmx-indicator"'),
    "O layout non usa o indicador HTMX global"
  );
  check(
    homeHtml.includes('id="global-htmx-indicator"') &&
      homeHtml.includes('src="/recursos/rastrexando-simbolo.png"'),
    "Falta a coruxa do indicador HTMX global"
  );
  check(homeHtml.includes('role="status"'), "O indicador HTMX non comunica o seu estado de forma accesible");
  check(
    homeHtml.includes('id="theme-toggle"') &&
      homeHtml.includes('aria-label="Activar tema escuro"') &&
      homeHtml.includes('aria-pressed="false"'),
    "Falta o selector de tema accesible"
  );
  check(
    homeHtml.indexOf('localStorage.getItem("rastrexando-theme")') < homeHtml.indexOf('href="/recursos/bundle.css"'),
    "O tema non se resolve antes de cargar os estilos"
  );
}


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
  check(sitemap.includes(`${siteUrl}/organizacions/`), "O sitemap non inclúe o directorio de organizacións");
}

const organizationsIndexPath = outputPathForUrl("/organizacions/");
check(
  organizationsIndexPath && fs.existsSync(organizationsIndexPath),
  "Falta o directorio de organizacións"
);
if (organizationsIndexPath && fs.existsSync(organizationsIndexPath)) {
  const organizationsIndexHtml = fs.readFileSync(organizationsIndexPath, "utf8");
  for (const organization of organizations) {
    const organizationUrl = `/organizacions/${organization.slug}/`;
    check(
      organizationsIndexHtml.includes(`href="${organizationUrl}"`),
      `O directorio non enlaza ${organization.name}`
    );
    check(
      fs.existsSync(outputPathForUrl(organizationUrl)),
      `Falta a páxina da organización ${organization.name}`
    );
  }
}

for (const { organizationSlug, eventUrl, relativeEventTemplate } of organizationEventReferences) {
  const organizationPagePath = outputPathForUrl(`/organizacions/${organizationSlug}/`);
  if (!organizationPagePath || !fs.existsSync(organizationPagePath)) continue;
  const organizationPageHtml = fs.readFileSync(organizationPagePath, "utf8");
  check(
    organizationPageHtml.includes(`href="${eventUrl}"`),
    `${relativeEventTemplate}: non aparece na páxina de ${organizationSlug}`
  );
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

const localMapResources = [
  "recursos/vendor/leaflet/leaflet.css",
  "recursos/vendor/leaflet/leaflet.js",
  "recursos/vendor/leaflet.markercluster/MarkerCluster.css",
  "recursos/vendor/leaflet.markercluster/MarkerCluster.Default.css",
  "recursos/vendor/leaflet.markercluster/leaflet.markercluster.js",
  "recursos/js/calendar-map.js"
];
for (const resource of localMapResources) {
  check(fs.existsSync(path.join(outputRoot, resource)), `Falta o recurso local do mapa: ${resource}`);
}

const calendarMapPath = path.join(outputRoot, "recursos/js/calendar-map.js");
if (fs.existsSync(calendarMapPath)) {
  const calendarMapSource = fs.readFileSync(calendarMapPath, "utf8");
  const expandControlUses = calendarMapSource.match(/addExpandControl\(canvas, map\);/g) || [];
  check(
    calendarMapSource.includes("map-is-expanded") &&
      calendarMapSource.includes('event.key === "Escape"') &&
      calendarMapSource.includes("map.scrollWheelZoom.enable()") &&
      calendarMapSource.includes("map-expanded-bar") &&
      calendarMapSource.includes("Centrar os marcadores") &&
      calendarMapSource.includes("Centrar a localización") &&
      calendarMapSource.includes("canvas._resetMapView") &&
      calendarMapSource.includes("dataset.controlLabel") &&
      calendarMapSource.includes('addZoomControlLabel(map)') &&
      expandControlUses.length === 2,
    "O control ampliado non está completo nos mapas anual e de evento"
  );
}

const bundleCssPath = path.join(outputRoot, "recursos/bundle.css");
if (fs.existsSync(bundleCssPath)) {
  const bundleCssSource = fs.readFileSync(bundleCssPath, "utf8");
  check(
    bundleCssSource.includes(".map-expand-button") &&
      bundleCssSource.includes(".map-reset-button") &&
      bundleCssSource.includes(".map-reset-icon") &&
      bundleCssSource.includes(".map-labeled-control::after") &&
      bundleCssSource.includes(".map-expanded-bar") &&
      bundleCssSource.includes(".calendar-map-canvas.map-is-expanded"),
    "Faltan os estilos do mapa a pantalla completa"
  );
}

const bottomNavigationResource = "recursos/js/bottom-navigation.js";
const bottomNavigationPath = path.join(outputRoot, bottomNavigationResource);
check(fs.existsSync(bottomNavigationPath), `Falta o control da navegación inferior: ${bottomNavigationResource}`);
if (fs.existsSync(bottomNavigationPath)) {
  const bottomNavigationSource = fs.readFileSync(bottomNavigationPath, "utf8");
  check(
    bottomNavigationSource.includes("IntersectionObserver") &&
      bottomNavigationSource.includes("prev-next-buttons--docked"),
    "A navegación inferior non evita o solapamento co footer"
  );
}

const themeResource = "recursos/js/theme.js";
const themePath = path.join(outputRoot, themeResource);
check(fs.existsSync(themePath), `Falta o control de tema: ${themeResource}`);
if (fs.existsSync(themePath)) {
  const themeSource = fs.readFileSync(themePath, "utf8");
  check(
    themeSource.includes('matchMedia("(prefers-color-scheme: dark)")') &&
      themeSource.includes("localStorage.setItem(storageKey, theme)"),
    "O selector non respecta o sistema ou non garda a preferencia de tema"
  );
}

const years = require(path.join(projectRoot, "_data", "years.json"));
const activeYear = String(years.at(-1).name);
const homeMap = checkMapYear("/", activeYear, "Inicio");
const activeMap = checkMapYear(`/calendarios/${activeYear}/`, activeYear, `Calendario ${activeYear}`);
const historicMap = checkMapYear("/calendarios/2018/", "2018", "Calendario histórico 2018");

if (homeMap && activeMap) {
  check(
    JSON.stringify(homeMap.data) === JSON.stringify(activeMap.data),
    "Inicio e calendario activo non reutilizan os mesmos datos do mapa"
  );
}

if (activeMap) {
  check(
    activeMap.data.locations.some((location) => (location.events || []).length > 1),
    `Calendario ${activeYear}: non hai eventos agrupados nunha mesma localización`
  );
}

const map2026 = activeYear === "2026"
  ? activeMap
  : checkMapYear("/calendarios/2026/", "2026", "Calendario 2026");
if (map2026) {
  const dates = map2026.events.map((event) => event.date);
  check(dates.some((date) => date < "2026-09-19"), "Calendario 2026: falta un caso de evento pasado");
  check(dates.some((date) => date >= "2026-09-19"), "Calendario 2026: falta un caso de evento actual ou próximo");
}

const eventDetailPath = outputPathForUrl("/calendarios/2026/iv-rastrexo-coruxo/");
if (eventDetailPath && fs.existsSync(eventDetailPath)) {
  const eventDetailHtml = fs.readFileSync(eventDetailPath, "utf8");
  check(!eventDetailHtml.includes("data-calendar-map"), "A ficha de evento inclúe por erro o mapa anual");
  check(eventDetailHtml.includes("data-event-map"), "A ficha non inclúe o seu mapa Leaflet");
  check(!eventDetailHtml.includes("event-map-open"), "A ficha ofrece abrir unha localización que só é aproximada");
  check(!eventDetailHtml.includes("<iframe"), "A ficha aínda usa un iframe para o mapa");
  check(eventDetailHtml.includes('class="prev-next-buttons"'), "A ficha non inclúe a navegación entre eventos");
  check(
    eventDetailHtml.includes('class="event-info event-date-info"') &&
      eventDetailHtml.includes('<i class="fi-calendar is-light-blue"></i>') &&
      eventDetailHtml.includes('<time datetime="2026-05-09">sábado, 9 de maio de 2026</time>'),
    "A ficha non mostra a data co formato orixinal"
  );
  check(
    eventDetailHtml.includes('href="https://www.facebook.com/rastrexocoruxo" target="_blank"') &&
      eventDetailHtml.includes('href="/organizacions/union-musical-de-coruxo/"') &&
      eventDetailHtml.includes('Ver todos os eventos (4)') &&
      eventDetailHtml.includes('"name": "Unión Musical de Coruxo"'),
    "A ficha non mostra o perfil e o arquivo da súa organización"
  );
  check(
    eventDetailHtml.includes('src="/recursos/js/bottom-navigation.js"'),
    "A ficha non carga o control que evita tapar o footer"
  );
}

const organizedEventPath = outputPathForUrl("/calendarios/2026/triloxia-samain-2026-capitulo-1-o-camino/");
if (organizedEventPath && fs.existsSync(organizedEventPath)) {
  const organizedEventHtml = fs.readFileSync(organizedEventPath, "utf8");
  const posterPosition = organizedEventHtml.indexOf('class="event-hero"');
  const datePosition = organizedEventHtml.indexOf('class="event-info event-date-info"');
  const relativeDatePosition = organizedEventHtml.indexOf('class="relative-date event-date-relative"');
  const titlePosition = organizedEventHtml.indexOf("<h1>");
  const typePosition = organizedEventHtml.indexOf('class="event-type-row"');
  const descriptionPosition = organizedEventHtml.indexOf('class="event-description"');
  const organizationPosition = organizedEventHtml.indexOf('class="event-organizations"');
  const mapPosition = organizedEventHtml.indexOf('class="event-map"');
  check(
    posterPosition >= 0 &&
      posterPosition < titlePosition &&
      titlePosition < typePosition &&
      typePosition < relativeDatePosition &&
      relativeDatePosition < datePosition &&
      datePosition < descriptionPosition &&
      descriptionPosition < organizationPosition &&
      organizationPosition < mapPosition,
    "A ficha non respecta a orde cartel, título, tipo, data, información, organización e mapa"
  );
  check(
    organizedEventHtml.includes('class="event-primary-header"') &&
      !organizedEventHtml.includes('id="event-date-title"') &&
      !organizedEventHtml.includes('id="event-description-title"'),
    "A ficha non agrupa data e título nunha cabeceira limpa"
  );
  check(
    organizedEventHtml.includes('<i class="fi-torsos-all is-light-blue"></i> Organiza') &&
      !organizedEventHtml.includes('<i class="fi-home is-light-blue"></i> Organización'),
    "A ficha non mostra a cabeceira «Organiza» co icono correcto"
  );
}

const camosEventPath = outputPathForUrl("/calendarios/2026/ix-rastrexo-camos/");
if (camosEventPath && fs.existsSync(camosEventPath)) {
  const camosEventHtml = fs.readFileSync(camosEventPath, "utf8");
  check(
    camosEventHtml.includes("Outros eventos") &&
      camosEventHtml.includes("Rastrexo Camos Especial CEIP da Cruz") &&
      camosEventHtml.includes('<time datetime="2026-08-01">01-08-2026</time>') &&
      camosEventHtml.includes("Ver todos os eventos (12)"),
    "A ficha de Camos non mostra a selección e o arquivo de eventos da organización"
  );
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
