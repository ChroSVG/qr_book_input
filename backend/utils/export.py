"""Export utilities — CSV and Excel file generation."""

import csv
import io

import openpyxl


def generate_csv(items) -> bytes:
    """Generate a CSV file with UTF-8 BOM encoding."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "qr_code", "name", "description", "extra_info", "created_at", "updated_at"])

    for item in items:
        writer.writerow([
            item.id,
            item.qr_code,
            item.name,
            item.description or "",
            item.extra_info or "",
            item.created_at.isoformat(),
            item.updated_at.isoformat(),
        ])

    return ("\ufeff" + output.getvalue()).encode("utf-8")


def generate_excel(items) -> bytes:
    """Generate an Excel (.xlsx) file."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["id", "qr_code", "name", "description", "extra_info", "created_at", "updated_at"])

    for item in items:
        ws.append([
            item.id,
            item.qr_code,
            item.name,
            item.description or "",
            item.extra_info or "",
            item.created_at.isoformat(),
            item.updated_at.isoformat(),
        ])

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio.read()
