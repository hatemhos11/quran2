export function formatPrayerClock(date: Date): string {
	return date.toLocaleTimeString('ar-SA', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
}

export function formatCountdown(totalMs: number): string {
	const ms = Math.max(0, totalMs);
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
