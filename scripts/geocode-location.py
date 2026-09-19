#!/usr/bin/env python3
"""Resolve and maintain approximate event locations with OpenStreetMap Nominatim."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "_data" / "locations.json"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "Rastrexando/1.0 (https://rastrexando.eu/)"


def read_catalog(path: Path) -> dict:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def write_catalog(path: Path, catalog: dict) -> None:
    path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def search_nominatim(location: str) -> list[dict]:
    query = urlencode(
        {
            "q": f"{location}, Galicia, Spain",
            "format": "jsonv2",
            "limit": 3,
            "countrycodes": "es",
            "accept-language": "gl",
        }
    )
    request = Request(
        f"{NOMINATIM_URL}?{query}",
        headers={"User-Agent": USER_AGENT},
    )
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def format_candidates(rows: list[dict]) -> list[dict]:
    return [
        {
            "lat": round(float(row["lat"]), 6),
            "lng": round(float(row["lon"]), 6),
            "display_name": row["display_name"],
            "type": row.get("type"),
        }
        for row in rows
    ]


def valid_coordinate(value: float, minimum: float, maximum: float, label: str) -> float:
    if not minimum <= value <= maximum:
        raise ValueError(f"{label} debe estar entre {minimum} y {maximum}.")
    return round(value, 6)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Resuelve ubicaciones aproximadas para eventos de Rastrexando."
    )
    parser.add_argument("location", help="Texto exacto del campo location del evento")
    parser.add_argument(
        "--add",
        action="store_true",
        help="Guarda una ubicación confirmada en el catálogo local.",
    )
    parser.add_argument("--lat", type=float, help="Latitud confirmada para --add")
    parser.add_argument("--lng", type=float, help="Longitud confirmada para --add")
    parser.add_argument("--province", help="Provincia confirmada para --add")
    parser.add_argument(
        "--catalog",
        type=Path,
        default=DEFAULT_CATALOG,
        help=argparse.SUPPRESS,
    )
    args = parser.parse_args()

    catalog = read_catalog(args.catalog)

    if args.add:
        if args.lat is None or args.lng is None or not args.province:
            parser.error("--add requiere --lat, --lng y --province.")
        try:
            latitude = valid_coordinate(args.lat, -90, 90, "La latitud")
            longitude = valid_coordinate(args.lng, -180, 180, "La longitud")
        except ValueError as error:
            parser.error(str(error))

        catalog[args.location] = {
            "lat": latitude,
            "lng": longitude,
            "province": args.province,
        }
        write_catalog(args.catalog, dict(sorted(catalog.items())))
        print(
            json.dumps(
                {"status": "saved", "location": args.location, "data": catalog[args.location]},
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    if args.location in catalog:
        print(
            json.dumps(
                {"status": "catalog", "location": args.location, "data": catalog[args.location]},
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    try:
        candidates = format_candidates(search_nominatim(args.location))
    except Exception as error:
        print(f"Non se puido consultar Nominatim: {error}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "status": "candidates" if candidates else "not_found",
                "location": args.location,
                "candidates": candidates,
                "next_step": "Valida o resultado e usa --add con coordenadas e provincia confirmadas.",
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
