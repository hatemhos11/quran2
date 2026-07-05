import { Prayer } from 'adhan';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ar } from '@/i18n/ar';
import {
	computePrayerTimes,
	DEFAULT_LOCATION,
	fetchDeviceLocation,
	getLocationWithoutPrompt,
	getNextPrayer,
	getPrayerSlots,
	noonDate,
	type PrayerName,
	type SavedLocation,
} from '@/services/prayerTimes';

export function usePrayerTimes() {
	const [location, setLocation] = useState<SavedLocation | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [now, setNow] = useState(() => new Date());
	const [usingDefaultLocation, setUsingDefaultLocation] = useState(true);

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const applyLocation = useCallback(
		(loc: SavedLocation, denied: boolean, usedFallback: boolean) => {
			setLocation(loc);
			setPermissionDenied(denied);
			setUsingDefaultLocation(
				usedFallback ||
					(loc.latitude === DEFAULT_LOCATION.latitude &&
						loc.longitude === DEFAULT_LOCATION.longitude &&
						loc.label === DEFAULT_LOCATION.label),
			);
		},
		[],
	);

	const loadInitial = useCallback(async () => {
		setLoading(true);
		try {
			const loc = await getLocationWithoutPrompt();
			applyLocation(loc, false, loc.label === DEFAULT_LOCATION.label);
		} catch {
			applyLocation({ ...DEFAULT_LOCATION }, false, true);
		} finally {
			setLoading(false);
		}
	}, [applyLocation]);

	const refresh = useCallback(async () => {
		setRefreshing(true);
		try {
			const result = await fetchDeviceLocation();
			applyLocation(
				result.location,
				!result.permissionGranted,
				result.usedFallback,
			);
		} catch {
			applyLocation({ ...DEFAULT_LOCATION }, true, true);
		} finally {
			setRefreshing(false);
		}
	}, [applyLocation]);

	useEffect(() => {
		void loadInitial();
	}, [loadInitial]);

	const today = useMemo(() => noonDate(now), [now]);

	const times = useMemo(() => {
		if (!location) return null;
		return computePrayerTimes(
			location.latitude,
			location.longitude,
			today,
		);
	}, [location, today]);

	const slots = useMemo(
		() => (times ? getPrayerSlots(times) : []),
		[times],
	);

	const currentPrayer = useMemo((): PrayerName | 'none' => {
		if (!times) return 'none';
		const current = times.currentPrayer(now);
		if (current === Prayer.None || current === Prayer.Sunrise) {
			return 'none';
		}
		return current as PrayerName;
	}, [times, now]);

	const nextPrayer = useMemo(() => {
		if (!times || !location) return null;
		return getNextPrayer(times, location, now);
	}, [times, location, now]);

	const countdownMs = nextPrayer
		? nextPrayer.time.getTime() - now.getTime()
		: 0;

	return {
		location,
		loading,
		refreshing,
		permissionDenied,
		now,
		slots,
		currentPrayer,
		nextPrayer,
		countdownMs,
		usingDefaultLocation,
		refresh,
		retry: refresh,
	};
}
