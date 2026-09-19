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

