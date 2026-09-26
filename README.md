# Rastrexando Web V2

https://rastrexando.eu/


## Dev

`npx @11ty/eleventy --serve`

## Localización aproximada de eventos

Las coordenadas reutilizables están en [`_data/locations.json`](_data/locations.json). Las fichas las aplican automáticamente cuando el texto de `location` coincide con una entrada del catálogo.

Consulta primero una ubicación:

```bash
npm run geocode -- "Nova localidade, Concello"
```

- Si ya existe, devuelve la entrada del catálogo sin consultar la red.
- Si es nueva, devuelve hasta tres candidatos de OpenStreetMap/Nominatim. Revisa el resultado: el marcador debe señalar la localidad o zona, no la salida exacta.

Después de validar coordenadas y provincia, guárdala explícitamente:

```bash
npm run geocode -- "Nova localidade, Concello" --add --lat 42.123456 --lng -8.123456 --province Pontevedra
```

La utilidad no modifica el catálogo durante una consulta. Usa Nominatim de forma puntual y no debe ejecutarse en lotes ni en paralelo.

## Organizaciones

Las organizaciones se definen una sola vez en [`_data/organizations.json`](_data/organizations.json) y los eventos las referencian mediante slugs estables:

```yaml
organizers:
  - rastrexo-camos
source_url: https://www.facebook.com/permalink.php?story_fbid=...
```

`organizers` admite varias entidades. Los perfiles sociales y la web oficial pertenecen al catálogo de organizaciones; `source_url` se reserva para una publicación, inscripción u otra fuente específica del evento y se omite cuando no existe. Las fichas históricas que todavía usan `source_name` y `source_url` continúan siendo compatibles durante la migración progresiva.

El sitio genera el directorio `/organizacions/`, una ficha por entidad y relaciones entre eventos que comparten organización. Los logos son opcionales y deben ser imágenes locales bajo `recursos/imaxes/`.

## Avisos en las fichas

Las correcciones o informaciones importantes se declaran en el frontmatter con `notices`. El layout las muestra después de la tarjeta de datos del evento y antes del mapa:

```yaml
notices:
  - date: "2026-07-21"
    message: "Corrixiuse o correo electrónico de contacto na imaxe do evento."
```

El campo acepta varios avisos, siempre con fecha `YYYY-MM-DD` y texto en gallego. No insertes el shortcode `renderNotice` directamente en el cuerpo de la ficha, porque aparecería después del mapa y de los vídeos.

## Vídeos de eventos

Los vídeos de YouTube se vinculan a su evento desde el frontmatter. `published` y `channel` son opcionales para mantener compatibles las fichas históricas:

```yaml
videos:
  - id: "NAFo107VFoQ"
    title: "VI RASTREXO NOCTURNO SOLIDARIO LOS PITUFOS"
    published: "2026-08-29"
    channel: "Cultural Verducido"
```

La portada muestra como máximo los tres vídeos más recientes asociados a eventos del año en curso. Se ordenan por `published`; si falta, se utiliza la fecha del evento.

## Mapa interactivo de calendarios

La home y las páginas anuales reutilizan el shortcode `renderCalendarMap` definido en [`.eleventy.js`](.eleventy.js). El shortcode recibe la colección del año visible, resuelve las coordenadas con el mismo criterio que las fichas (`map_lat`/`map_lng` como override y [`_data/locations.json`](_data/locations.json) como catálogo) y genera únicamente el JSON de ese año. Los eventos sin coordenadas válidas se omiten.

[`recursos/js/calendar-map.js`](recursos/js/calendar-map.js) convierte esos datos en un mapa Leaflet, agrupa eventos con las mismas coordenadas en un marcador y usa MarkerCluster para puntos próximos. También inicializa con Leaflet el mapa individual de cada ficha. El estado pasado/próximo se calcula comparando fechas locales en el navegador, por lo que no requiere reconstruir el sitio. El script inicializa los mapas en `DOMContentLoaded` y después de `htmx:afterSettle`, y elimina todas las instancias activas antes de cada swap para evitar capas residuales.

Leaflet y MarkerCluster están fijados en `package.json`. Eleventy copia sus distribuciones desde `node_modules` a `/recursos/vendor/`; no se usan CDN. Para actualizarlos, cambia las versiones con npm, ejecuta `npm test` y comprueba los mapas de la home, del año activo y de un año histórico. Las teselas proceden de OpenStreetMap y necesitan conexión de red en el navegador.

