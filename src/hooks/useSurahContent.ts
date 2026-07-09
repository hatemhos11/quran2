import { useCallback, useEffect, useRef, useState } from 'react';

import {
  loadAyahsByPageOffline,
  loadAyahsChunkOffline,
  loadSurahAyahIndexOffline,
  loadSurahMetaOffline,
  loadSurahPageNumbersOffline,
} from '@/services/offlineStorage';
import type { Ayah, AyahLayoutMode, SurahMeta } from '@/types';
import {
  SURAH_AYAH_PAGE_SIZE,
  SURAH_MUSHAF_PAGES_PER_LOAD,
} from '@/utils/constants';
import { prepareAyahBatch } from '@/utils/prepareAyahText';

export type AyahIndex = Pick<Ayah, 'numberInSurah' | 'numberInQuran' | 'page'>;

export type AyahPage = {
  key: string;
  ayahs: Ayah[];
};

export type MushafPage = {
  page: number;
  ayahs: Ayah[];
};

type UseSurahContentResult = {
  meta: SurahMeta | null;
  ayahIndex: AyahIndex[];
  ayahPages: AyahPage[];
  mushafPages: MushafPage[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
};

export function useSurahContent(
  surahNumber: number,
  layout: AyahLayoutMode,
): UseSurahContentResult {
  const [meta, setMeta] = useState<SurahMeta | null>(null);
  const [ayahIndex, setAyahIndex] = useState<AyahIndex[]>([]);
  const [ayahPages, setAyahPages] = useState<AyahPage[]>([]);
  const [mushafPages, setMushafPages] = useState<MushafPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadedAyahOffsetRef = useRef(0);
  const loadedMushafIndexRef = useRef(0);
  const allMushafPagesRef = useRef<number[]>([]);
  const loadingMoreRef = useRef(false);

  const stripBasmalah = surahNumber !== 1 && surahNumber !== 9;

  const reset = useCallback(() => {
    loadedAyahOffsetRef.current = 0;
    loadedMushafIndexRef.current = 0;
    allMushafPagesRef.current = [];
    loadingMoreRef.current = false;
    setMeta(null);
    setAyahIndex([]);
    setAyahPages([]);
    setMushafPages([]);
    setHasMore(true);
    setError(null);
  }, []);

  const appendAyahPage = useCallback((rows: Ayah[], pageIndex: number) => {
    if (!rows.length) return;
    setAyahPages((prev) => [
      ...prev,
      {
        key: `${surahNumber}-ayah-page-${pageIndex}`,
        ayahs: rows,
      },
    ]);
  }, [surahNumber]);

  const loadAyahPage = useCallback(
    async (offset: number, pageIndex: number) => {
      const rows = await loadAyahsChunkOffline(
        surahNumber,
        offset,
        SURAH_AYAH_PAGE_SIZE,
      );
      const prepared = prepareAyahBatch(rows, {
        stripLeadingBasmalah: stripBasmalah && offset === 0,
      });
      appendAyahPage(prepared, pageIndex);
      loadedAyahOffsetRef.current = offset + prepared.length;
      return prepared.length;
    },
    [appendAyahPage, stripBasmalah, surahNumber],
  );

  const loadMushafPages = useCallback(
    async (startIndex: number, count: number) => {
      const slice = allMushafPagesRef.current.slice(
        startIndex,
        startIndex + count,
      );
      if (!slice.length) return 0;

      const loaded = await Promise.all(
        slice.map(async (page) => {
          const rows = await loadAyahsByPageOffline(surahNumber, page);
          return {
            page,
            ayahs: prepareAyahBatch(rows, {
              stripLeadingBasmalah: stripBasmalah,
            }),
          };
        }),
      );

      setMushafPages((prev) => [...prev, ...loaded]);
      loadedMushafIndexRef.current = startIndex + loaded.length;
      return loaded.length;
    },
    [stripBasmalah, surahNumber],
  );

  useEffect(() => {
    let cancelled = false;
    reset();
    setLoading(true);

    void (async () => {
      try {
        const [surahMeta, index] = await Promise.all([
          loadSurahMetaOffline(surahNumber),
          loadSurahAyahIndexOffline(surahNumber),
        ]);
        if (cancelled) return;

        if (!surahMeta) {
          setError('failed');
          setHasMore(false);
          return;
        }

        setMeta(surahMeta);
        setAyahIndex(index);

        if (layout === 'continuous') {
          const pages = await loadSurahPageNumbersOffline(surahNumber);
          if (cancelled) return;
          allMushafPagesRef.current = pages;
          const loaded = await loadMushafPages(0, SURAH_MUSHAF_PAGES_PER_LOAD);
          if (cancelled) return;
          setHasMore(loaded > 0 && loadedMushafIndexRef.current < pages.length);
        } else {
          const loaded = await loadAyahPage(0, 0);
          if (cancelled) return;
          setHasMore(loaded > 0 && loadedAyahOffsetRef.current < surahMeta.numberOfAyahs);
        }
      } catch {
        if (!cancelled) setError('failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [layout, loadAyahPage, loadMushafPages, reset, surahNumber]);

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    void (async () => {
      try {
        if (layout === 'continuous') {
          const loaded = await loadMushafPages(
            loadedMushafIndexRef.current,
            SURAH_MUSHAF_PAGES_PER_LOAD,
          );
          if (!loaded) {
            setHasMore(false);
            return;
          }
          setHasMore(
            loadedMushafIndexRef.current < allMushafPagesRef.current.length,
          );
        } else if (meta) {
          const loaded = await loadAyahPage(
            loadedAyahOffsetRef.current,
            ayahPages.length,
          );
          if (!loaded) {
            setHasMore(false);
            return;
          }
          setHasMore(loadedAyahOffsetRef.current < meta.numberOfAyahs);
        }
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  }, [
    ayahPages.length,
    hasMore,
    layout,
    loadAyahPage,
    loadMushafPages,
    loading,
    meta,
  ]);

  return {
    meta,
    ayahIndex,
    ayahPages,
    mushafPages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  };
}
