#!/usr/bin/env python3
"""Build quran_reader.db from bundled JSON seed files."""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QURAN_JSON = ROOT / "src/store/quran-db.json"
TAFSIR_JSON = ROOT / "src/store/Tafsir Muyassar.json"
AZKAR_JSON = ROOT / "src/store/azkar_obj.json"
OUTPUT = ROOT / "assets/quran_reader.db"
MUYASSAR_ID = "ar.muyassar"


def parse_sajda(sajda):
    if sajda is False:
        return 0, None, None, None
    return 1, sajda["id"], int(sajda["recommended"]), int(sajda["obligatory"])


def resolve_tafsir(data: dict, key: str, visited: set[str] | None = None) -> str | None:
    visited = visited or set()
    if key in visited:
        return None
    visited.add(key)
    entry = data.get(key)
    if entry is None:
        return None
    if isinstance(entry, str):
        return resolve_tafsir(data, entry, visited)
    return entry.get("text") or None


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;
        CREATE TABLE surahs (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          englishName TEXT NOT NULL,
          revelationType TEXT NOT NULL,
          numberOfAyahs INTEGER NOT NULL,
          downloadedAt INTEGER,
          englishNameTranslation TEXT,
          seeded INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE ayahs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          surahId INTEGER NOT NULL,
          numberInSurah INTEGER NOT NULL,
          text TEXT NOT NULL,
          numberInQuran INTEGER NOT NULL,
          juz INTEGER,
          manzil INTEGER,
          page INTEGER,
          ruku INTEGER,
          hizbQuarter INTEGER,
          sajda INTEGER NOT NULL DEFAULT 0,
          sajdaId INTEGER,
          sajdaRecommended INTEGER,
          sajdaObligatory INTEGER,
          UNIQUE(surahId, numberInSurah),
          FOREIGN KEY (surahId) REFERENCES surahs(id) ON DELETE CASCADE
        );
        CREATE TABLE tafsir (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ayahId INTEGER NOT NULL,
          source TEXT NOT NULL,
          text TEXT NOT NULL,
          UNIQUE(ayahId, source),
          FOREIGN KEY (ayahId) REFERENCES ayahs(id) ON DELETE CASCADE
        );
        CREATE TABLE editions (
          identifier TEXT PRIMARY KEY NOT NULL,
          language TEXT NOT NULL,
          name TEXT NOT NULL,
          englishName TEXT NOT NULL,
          format TEXT NOT NULL,
          type TEXT NOT NULL
        );
        CREATE INDEX idx_ayahs_surah ON ayahs(surahId);
        CREATE TABLE azkar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          text TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 1,
          description TEXT,
          reference TEXT,
          sortOrder INTEGER NOT NULL
        );
        CREATE INDEX idx_azkar_category ON azkar(category);
        CREATE INDEX idx_azkar_sort ON azkar(sortOrder);
        """
    )


def seed_quran(conn: sqlite3.Connection, db_json: dict) -> None:
    edition = db_json["edition"]
    conn.execute(
        """
        INSERT INTO editions (identifier, language, name, englishName, format, type)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            edition["identifier"],
            edition["language"],
            edition["name"],
            edition["englishName"],
            edition["format"],
            edition["type"],
        ),
    )

    for surah in db_json["surahs"]:
        conn.execute(
            """
            INSERT INTO surahs (
              id, name, englishName, englishNameTranslation, revelationType,
              numberOfAyahs, downloadedAt, seeded
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1)
            """,
            (
                surah["number"],
                surah["name"],
                surah["englishName"],
                surah["englishNameTranslation"],
                surah["revelationType"],
                len(surah["ayahs"]),
            ),
        )
        for ayah in surah["ayahs"]:
            sajda, sajda_id, sajda_rec, sajda_ob = parse_sajda(ayah["sajda"])
            conn.execute(
                """
                INSERT INTO ayahs (
                  surahId, numberInSurah, text, numberInQuran,
                  juz, manzil, page, ruku, hizbQuarter,
                  sajda, sajdaId, sajdaRecommended, sajdaObligatory
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    surah["number"],
                    ayah["numberInSurah"],
                    ayah["text"],
                    ayah["number"],
                    ayah["juz"],
                    ayah["manzil"],
                    ayah["page"],
                    ayah["ruku"],
                    ayah["hizbQuarter"],
                    sajda,
                    sajda_id,
                    sajda_rec,
                    sajda_ob,
                ),
            )


def seed_tafsir(conn: sqlite3.Connection, tafsir_json: dict) -> None:
    conn.execute(
        """
        INSERT INTO editions (identifier, language, name, englishName, format, type)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (MUYASSAR_ID, "ar", "تفسير الميسر", "Muyassar", "text", "tafsir"),
    )

    rows = conn.execute("SELECT id, surahId, numberInSurah FROM ayahs").fetchall()
    ayah_ids = {f"{surah_id}:{number_in_surah}": ayah_id for ayah_id, surah_id, number_in_surah in rows}

    for key, entry in tafsir_json.items():
        ayah_id = ayah_ids.get(key)
        if not ayah_id:
            continue
        text = resolve_tafsir(tafsir_json, key) if isinstance(entry, str) else entry.get("text")
        if not text:
            continue
        conn.execute(
            "INSERT OR IGNORE INTO tafsir (ayahId, source, text) VALUES (?, ?, ?)",
            (ayah_id, MUYASSAR_ID, text),
        )


def normalize_azkar_count(value) -> int:
    if value is None or value == "":
        return 1
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return 1


def seed_azkar(conn: sqlite3.Connection, items: list[dict]) -> None:
    for index, item in enumerate(items):
        conn.execute(
            """
            INSERT INTO azkar (category, text, count, description, reference, sortOrder)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                item["category"].strip(),
                item["zekr"].strip(),
                normalize_azkar_count(item.get("count")),
                (item.get("description") or "").strip() or None,
                (item.get("reference") or "").strip() or None,
                index + 1,
            ),
        )


def main() -> int:
    if not QURAN_JSON.exists():
        print(f"Missing {QURAN_JSON}", file=sys.stderr)
        return 1
    if not TAFSIR_JSON.exists():
        print(f"Missing {TAFSIR_JSON}", file=sys.stderr)
        return 1
    if not AZKAR_JSON.exists():
        print(f"Missing {AZKAR_JSON}", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT.exists():
        OUTPUT.unlink()

    with open(QURAN_JSON, encoding="utf-8") as f:
        quran_data = json.load(f)
    with open(TAFSIR_JSON, encoding="utf-8") as f:
        tafsir_data = json.load(f)
    with open(AZKAR_JSON, encoding="utf-8") as f:
        azkar_data = json.load(f)

    conn = sqlite3.connect(OUTPUT)
    try:
        init_schema(conn)
        seed_quran(conn, quran_data)
        seed_tafsir(conn, tafsir_data)
        seed_azkar(conn, azkar_data)
        conn.commit()

        counts = {
            "surahs": conn.execute("SELECT COUNT(*) FROM surahs").fetchone()[0],
            "ayahs": conn.execute("SELECT COUNT(*) FROM ayahs").fetchone()[0],
            "tafsir": conn.execute("SELECT COUNT(*) FROM tafsir").fetchone()[0],
            "azkar": conn.execute("SELECT COUNT(*) FROM azkar").fetchone()[0],
            "editions": conn.execute("SELECT COUNT(*) FROM editions").fetchone()[0],
        }
    finally:
        conn.close()

    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"Exported {OUTPUT}")
    print(f"Size: {size_mb:.2f} MB")
    print(
        "Rows:",
        f"surahs={counts['surahs']}",
        f"ayahs={counts['ayahs']}",
        f"tafsir={counts['tafsir']}",
        f"azkar={counts['azkar']}",
        f"editions={counts['editions']}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
