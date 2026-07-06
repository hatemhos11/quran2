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
  AYAH_INITIAL_CHUNK_SIZE,
  AYAH_LOAD_CHUNK_SIZE,
  MUSHAF_INITIAL_PAGES,
} from '@/utils/constants';
import { prepareAyahBatch } from '@/utils/prepareAyahText';

export type AyahIndex = Pick<Ayah, 'numberInSurah' | 'numberInQuran' | 'page'>;

type UseSurahContentResult = {
  meta: SurahMeta | null;
  ayahIndex: AyahIndex[];
  ayahs: Ayah[];
  pageNumbers: number[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  getPageAyahs: (page: number) => Ayah[] | undefined;
  ensurePageLoaded: (page: number) => void;
};

export function useSurahContent(
  surahNumber: number,
  layout: AyahLayoutMode,
): UseSurahContentResult {
  const [meta, setMeta] = useState<SurahMeta | null>(null);
  const [ayahIndex, setAyahIndex] = useState<AyahIndex[]>([]);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageVersion, setPageVersion] = useState(0);

  const loadedOffsetRef = useRef(0);
  const pageCacheRef = useRef<Map<number, Ayah[]>>(new Map());
  const loadingPagesRef = useRef<Set<number>>(new Set());
  const loadedPageCountRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const stripBasmalah = surahNumber !== 1 && surahNumber !== 9;

  const reset = useCallback(() => {
    loadedOffsetRef.current = 0;
    pageCacheRef.current = new Map();
    loadingPagesRef.current = new Set();
    loadedPageCountRef.current = 0;
    loadingMoreRef.current = false;
    setMeta(null);
    setAyahIndex([]);
    setAyahs([]);
    setPageNumbers([]);
    setHasMore(true);
    setError(null);
    setPageVersion(0);
  }, []);

  const loadPages = useCallback(
    async (pages: number[]) => {
      const pending = pages.filter(
        (page) =>
          !pageCacheRef.current.has(page) && !loadingPagesRef.current.has(page),
      );
      if (!pending.length) return;

      for (const page of pending) loadingPagesRef.current.add(page);

      await Promise.all(
        pending.map(async (page) => {
          try {
            const rows = await loadAyahsByPageOffline(surahNumber, page);
            pageCacheRef.current.set(
              page,
              prepareAyahBatch(rows, { stripLeadingBasmalah: stripBasmalah }),
            );
          } finally {
            loadingPagesRef.current.delete(page);
          }
        }),
      );

      setPageVersion((v) => v + 1);
    },
    [stripBasmalah, surahNumber],
  );

  useEffect(() => {
    let cancelled = false;
    reset();
    setLoading(true);

    (async () => {
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
          setPageNumbers(pages);
          loadedPageCountRef.current = Math.min(MUSHAF_INITIAL_PAGES, pages.length);
          setHasMore(loadedPageCountRef.current < pages.length);
          await loadPages(pages.slice(0, loadedPageCountRef.current));
        } else {
          const first = await loadAyahsChunkOffline(
            surahNumber,
            0,
            AYAH_INITIAL_CHUNK_SIZE,
          );
          if (cancelled) return;
          const prepared = prepareAyahBatch(first, {
            stripLeadingBasmalah: stripBasmalah,
          });
          loadedOffsetRef.current = prepared.length;
          setAyahs(prepared);
          setHasMore(prepared.length < surahMeta.numberOfAyahs);
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
  }, [layout, loadPages, reset, stripBasmalah, surahNumber]);

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    void (async () => {
      try {
        if (layout === 'continuous') {
          const nextPages = pageNumbers.slice(
            loadedPageCountRef.current,
            loadedPageCountRef.current + MUSHAF_INITIAL_PAGES,
          );
          if (!nextPages.length) {
            setHasMore(false);
            return;
          }
          await loadPages(nextPages);
          loadedPageCountRef.current += nextPages.length;
          setHasMore(loadedPageCountRef.current < pageNumbers.length);
        } else if (meta) {
          const chunk = await loadAyahsChunkOffline(
            surahNumber,
            loadedOffsetRef.current,
            AYAH_LOAD_CHUNK_SIZE,
          );
          if (!chunk.length) {
            setHasMore(false);
            return;
          }
          const prepared = prepareAyahBatch(chunk, {
            stripLeadingBasmalah: stripBasmalah && loadedOffsetRef.current === 0,
          });
          loadedOffsetRef.current += chunk.length;
          setAyahs((prev) => [...prev, ...prepared]);
          setHasMore(loadedOffsetRef.current < meta.numberOfAyahs);
        }
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  }, [hasMore, layout, loadPages, loading, meta, pageNumbers, stripBasmalah, surahNumber]);

  const getPageAyahs = useCallback(
    (page: number) => {
      void pageVersion;
      return pageCacheRef.current.get(page);
    },
    [pageVersion],
  );

  const ensurePageLoaded = useCallback(
    (page: number) => {
      if (pageCacheRef.current.has(page) || loadingPagesRef.current.has(page)) {
        return;
      }
      void loadPages([page]);
    },
    [loadPages],
  );

  return {
    meta,
    ayahIndex,
    ayahs,
    pageNumbers,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    getPageAyahs,
    ensurePageLoaded,
  };
}
