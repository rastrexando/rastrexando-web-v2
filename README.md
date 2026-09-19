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

## Mapa interactivo de calendarios

La home y las páginas anuales reutilizan el shortcode `renderCalendarMap` definido en [`.eleventy.js`](.eleventy.js). El shortcode recibe la colección del año visible, resuelve las coordenadas con el mismo criterio que las fichas (`map_lat`/`map_lng` como override y [`_data/locations.json`](_data/locations.json) como catálogo) y genera únicamente el JSON de ese año. Los eventos sin coordenadas válidas se omiten.

[`recursos/js/calendar-map.js`](recursos/js/calendar-map.js) convierte esos datos en un mapa Leaflet, agrupa eventos con las mismas coordenadas en un marcador y usa MarkerCluster para puntos próximos. También inicializa con Leaflet el mapa individual de cada ficha. El estado pasado/próximo se calcula comparando fechas locales en el navegador, por lo que no requiere reconstruir el sitio. El script inicializa los mapas en `DOMContentLoaded` y después de `htmx:afterSettle`, y elimina todas las instancias activas antes de cada swap para evitar capas residuales.

Leaflet y MarkerCluster están fijados en `package.json`. Eleventy copia sus distribuciones desde `node_modules` a `/recursos/vendor/`; no se usan CDN. Para actualizarlos, cambia las versiones con npm, ejecuta `npm test` y comprueba los mapas de la home, del año activo y de un año histórico. Las teselas proceden de OpenStreetMap y necesitan conexión de red en el navegador.

