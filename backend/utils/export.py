"""Export utilities — CSV and Excel file generation."""

import csv
import io

import openpyxl

EXPORT_HEADERS = [
    "id", "item_code", "title", "edition", "publisher_name", "publish_year",
    "call_number", "language_name", "place_name", "classification", "authors",
    "topics", "volume", "description", "extra_info", "created_at", "updated_at",
]


def _row(item):
    return [
        item.id,
        item.item_code,
        item.title,
        item.edition or "",
        item.publisher_name or "",
        item.publish_year or "",
        item.call_number or "",
        item.language_name or "",
        item.place_name or "",
        item.classification or "",
        item.authors or "",
        item.topics or "",
        item.volume or "",
        item.description or "",
        item.extra_info or "",
        item.created_at.isoformat(),
        item.updated_at.isoformat(),
    ]


def generate_csv(items) -> bytes:
    """Generate a CSV file with UTF-8 BOM encoding."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(EXPORT_HEADERS)
    for item in items:
        writer.writerow(_row(item))
    return ("\ufeff" + output.getvalue()).encode("utf-8")


def generate_excel(items) -> bytes:
    """Generate an Excel (.xlsx) file."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(EXPORT_HEADERS)
    for item in items:
        ws.append(_row(item))
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio.read()
