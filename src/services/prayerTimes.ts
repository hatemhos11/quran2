import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	CalculationMethod,
	Coordinates,
	Madhab,
	Prayer,
	PrayerTimes,
} from 'adhan';
import { Linking } from 'react-native';

const STORAGE_KEY = 'prayer_location_v1';

export const DEFAULT_LOCATION = {
	latitude: 24.7136,
	longitude: 46.6753,
	label: 'الرياض',
} as const;

export type SavedLocation = {
	latitude: number;
	longitude: number;
	label: string;
};

export type LocationFetchResult = {
	location: SavedLocation;
	permissionGranted: boolean;
	usedFallback: boolean;
};

export type PrayerName =
	| 'fajr'
	| 'sunrise'
	| 'dhuhr'
	| 'asr'
	| 'maghrib'
	| 'isha';

export type PrayerSlot = {
	id: PrayerName;
	time: Date;
};

type LocationModule = typeof import('expo-location');

let locationModulePromise: Promise<LocationModule> | null = null;

async function getLocationModule(): Promise<LocationModule> {
	if (!locationModulePromise) {
		locationModulePromise = import('expo-location');
	}
	return locationModulePromise;
}

export function computePrayerTimes(
	latitude: number,
	longitude: number,
	date = new Date(),
): PrayerTimes {
	const coordinates = new Coordinates(latitude, longitude);
	const params = CalculationMethod.MuslimWorldLeague();
	params.madhab = Madhab.Shafi;
	return new PrayerTimes(coordinates, date, params);
}

export function getPrayerSlots(times: PrayerTimes): PrayerSlot[] {
	return [
		{ id: 'fajr', time: times.fajr },
		{ id: 'sunrise', time: times.sunrise },
		{ id: 'dhuhr', time: times.dhuhr },
		{ id: 'asr', time: times.asr },
		{ id: 'maghrib', time: times.maghrib },
		{ id: 'isha', time: times.isha },
	];
}

export function noonDate(date: Date): Date {
	const d = new Date(date);
	d.setHours(12, 0, 0, 0);
	return d;
}

export function getNextPrayer(
	times: PrayerTimes,
	location: SavedLocation,
	now: Date,
): { id: PrayerName; time: Date } {
	const nextId = times.nextPrayer(now);

	if (nextId === Prayer.None) {
		const tomorrow = new Date(noonDate(now));
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowTimes = computePrayerTimes(
			location.latitude,
			location.longitude,
			tomorrow,
		);
		return { id: 'fajr', time: tomorrowTimes.fajr };
	}

	const prayerId = nextId as PrayerName;
	const time = times.timeForPrayer(nextId);
	return { id: prayerId, time: time ?? times.fajr };
}

export async function loadSavedLocation(): Promise<SavedLocation | null> {
	const raw = await AsyncStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as SavedLocation;
	} catch {
		return null;
	}
}

export async function saveLocation(loc: SavedLocation): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

export async function openLocationSettings(): Promise<void> {
	await Linking.openSettings();
}

async function resolveCityLabel(
	Location: LocationModule,
	latitude: number,
	longitude: number,
): Promise<string> {
	try {
		const results = await Location.reverseGeocodeAsync({
			latitude,
			longitude,
		});
		const place = results[0];
		if (!place) {
			return `${latitude.toFixed(2)}°، ${longitude.toFixed(2)}°`;
		}
		return (
			place.city ||
			place.district ||
			place.region ||
			place.country ||
			`${latitude.toFixed(2)}°، ${longitude.toFixed(2)}°`
		);
	} catch {
		return `${latitude.toFixed(2)}°، ${longitude.toFixed(2)}°`;
	}
}

async function readDeviceCoordinates(
	Location: LocationModule,
): Promise<{ latitude: number; longitude: number } | null> {
	const lastKnown = await Location.getLastKnownPositionAsync({
		maxAge: 60_000 * 60,
	});
	if (lastKnown) {
		return lastKnown.coords;
	}

	const position = await Location.getCurrentPositionAsync({
		accuracy: Location.Accuracy.Balanced,
	});
	return position.coords;
}

export async function fetchDeviceLocation(): Promise<LocationFetchResult> {
	try {
		const Location = await getLocationModule();

		let permission = await Location.getForegroundPermissionsAsync();
		if (!permission.granted) {
			permission = await Location.requestForegroundPermissionsAsync();
		}

		if (!permission.granted) {
			return {
				location: { ...DEFAULT_LOCATION },
				permissionGranted: false,
				usedFallback: true,
			};
		}

		const servicesEnabled = await Location.hasServicesEnabledAsync();
		if (!servicesEnabled) {
			return {
				location: { ...DEFAULT_LOCATION },
				permissionGranted: true,
				usedFallback: true,
			};
		}

		const coords = await readDeviceCoordinates(Location);
		if (!coords) {
			return {
				location: { ...DEFAULT_LOCATION },
				permissionGranted: true,
				usedFallback: true,
			};
		}

		const { latitude, longitude } = coords;
		const label = await resolveCityLabel(Location, latitude, longitude);
		const loc = { latitude, longitude, label };
		await saveLocation(loc);
		return {
			location: loc,
			permissionGranted: true,
			usedFallback: false,
		};
	} catch {
		return {
			location: { ...DEFAULT_LOCATION },
			permissionGranted: false,
			usedFallback: true,
		};
	}
}

/** Loads cached location or default — does not request permission. */
export async function getLocationWithoutPrompt(): Promise<SavedLocation> {
	const saved = await loadSavedLocation();
	if (saved) return saved;
	return { ...DEFAULT_LOCATION };
}
