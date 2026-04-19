/**
 * Checks if the given text starts with the Arabic "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
 * Returns true if so, false otherwise.
 */
export function isBasmalah(text: string): boolean {
    // Normalize for Arabic presentation form, whitespace, and common variants
    const BASMALAH =
        "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    // Ignore tatweel (ـ), extra spaces, standardize with/without diacritics to the baseline
    const normalize = (s: string) =>
        s
            .replace(/ـ/g, "") // remove tatweel
            .replace(/[\u064B-\u065F]/g, "") // remove diacritics
            .replace(/\s+/g, " ") // collapse spaces
            .trim();

    return normalize(text).startsWith(normalize(BASMALAH));
}


export function removeBasmalah(text: string): string {
    const BASMALAH =
        "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    return text.replace(BASMALAH, "");
}