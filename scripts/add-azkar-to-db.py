#!/usr/bin/env python3
"""Add azkar tables and data to an existing quran_reader.db."""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "assets/quran_reader.db"
AZKAR_JSON = ROOT / "src/store/azkar_obj.json"


def normalize_count(value) -> int:
    if value is None or value == "":
        return 1
    try:
        n = int(value)
        return max(1, n)
    except (TypeError, ValueError):
        return 1


def init_azkar_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS azkar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          text TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 1,
          description TEXT,
          reference TEXT,
          sortOrder INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_azkar_category ON azkar(category);
        CREATE INDEX IF NOT EXISTS idx_azkar_sort ON azkar(sortOrder);
        """
    )


def seed_azkar(conn: sqlite3.Connection, items: list[dict]) -> None:
    existing = conn.execute("SELECT COUNT(*) FROM azkar").fetchone()[0]
    if existing > 0:
        print(f"Azkar already seeded ({existing} rows), skipping.")
        return

    for index, item in enumerate(items):
        conn.execute(
            """
            INSERT INTO azkar (category, text, count, description, reference, sortOrder)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                item["category"].strip(),
                item["zekr"].strip(),
                normalize_count(item.get("count")),
                (item.get("description") or "").strip() or None,
                (item.get("reference") or "").strip() or None,
                index + 1,
            ),
        )


def main() -> int:
    if not DB_PATH.exists():
        print(f"Missing database: {DB_PATH}", file=sys.stderr)
        return 1
    if not AZKAR_JSON.exists():
        print(f"Missing azkar JSON: {AZKAR_JSON}", file=sys.stderr)
        return 1

    with open(AZKAR_JSON, encoding="utf-8") as f:
        items = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    try:
        init_azkar_schema(conn)
        seed_azkar(conn, items)
        conn.commit()
        total = conn.execute("SELECT COUNT(*) FROM azkar").fetchone()[0]
        categories = conn.execute("SELECT COUNT(DISTINCT category) FROM azkar").fetchone()[0]
    finally:
        conn.close()

    print(f"Updated {DB_PATH}")
    print(f"Azkar rows: {total}, categories: {categories}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
