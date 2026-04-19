/** Arabic noun form for "ayah" by count:
 * ١ = آية
 * ٢ = آيتان
 * ٣-١٠ = آيات
 * ١١ وأكثر = آية
 */
export function ayahWordAr(count: number): string {
  if (count === 1) return 'آية';
  if (count === 2) return 'آيتان';
  if (count >= 3 && count <= 10) return `${count} آيات`;
  return `${count} آية`;
}
