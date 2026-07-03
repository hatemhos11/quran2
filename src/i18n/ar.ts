import { ayahWordAr } from '../utils/ayahWordAr';

/** واجهة المستخدم بالعربية */
export const ar = {
  surahs: 'السور',
  azkar: 'أذكار',
  comingSoon: 'قريباً',
  searchPlaceholder: 'ابحث بالاسم أو الرقم',
  couldNotLoadSurahs: 'تعذر تحميل السور',
  tryAgain: 'إعادة المحاولة',
  loading: 'جارٍ التحميل…',
  noMatches: 'لا نتائج.',
  makki: 'مكية',
  madani: 'مدنية',
  subAyahs: (n: number) => `${ayahWordAr(n)}`,
  offlineSaved: 'محفوظ للعمل دون اتصال',
  removeDownload: 'حذف التنزيل',
  downloadSurah: 'تنزيل السورة',
  downloadingPct: (n: number) => `جارٍ التنزيل ${n}٪`,
  connectToDownload: 'اتصل بالإنترنت لتنزيل السورة والتفسير.',
  settings: 'الإعدادات',
  openSurahList: 'فتح قائمة السور',
  scrollToTop: 'الصعود للأعلى',
  somethingWrong: 'حدث خطأ',
  unknownError: 'خطأ غير معروف',
  offlineBanner: 'وضع دون اتصال — عرض المحتوى المحفوظ عند توفره.',
  surahNotDownloaded:
    'هذه السورة غير منزّلة. اتصل بالإنترنت أو نزّلها وأنت متصل.',
  failedLoadSurah: 'فشل تحميل السورة',
  downloadFailed: 'فشل التنزيل',
  surahNumber: (n: number) => `سورة ${n}`,
  tafsir: 'التفسير',
  copy: 'نسخ',
  share: 'مشاركة',
  selectAyah: 'اختر آية.',
  tafsirOfflineUnavailable:
    'التفسير غير متاح دون اتصال لهذه الآية. نزّل السورة وأنت متصل ليُحفظ التفسير.',
  noTafsir: 'لا يوجد تفسير لهذا المصدر.',
  tafsirLoadError: 'تعذر تحميل التفسير. حاول مجدداً.',
  reading: 'القراءة',
  arabicSize: (px: number) => `حجم النص العربي (${Math.round(px)} بكسل)`,
  transliterationTitle: 'التهجئة الإنجليزية',
  transliterationDesc: 'أسماء السور بالحروف اللاتينية',
  arabicFont: 'خط النص العربي',
  fontAmiri: 'أميري',
  fontScheherazade: 'شهرزاد',
  fontSystem: 'النظام',
  appearance: 'المظهر',
  light: 'فاتح',
  dark: 'داكن',
  preferredTafsir: 'مصدر التفسير المفضل',
  tafsirMuyassarTitle: 'تفسير الميسر',
  pinAyahA11y: 'تثبيت الآية',
  unpinAyahA11y: 'إلغاء تثبيت الآية',
  offlineStorage: 'التخزين دون اتصال',
  estimatedData: 'البيانات التقريبية في القاعدة',
  approxDownloadPackageTitle: 'حجم التنزيل (تقريبي)',
  approxDownloadPackageFull: (total: string, remaining: string | null) =>
    remaining
      ? `الحزمة الكاملة (نص وتفسير): حوالي ${total} — المتبقي: ${remaining}`
      : `الحزمة الكاملة (نص وتفسير): حوالي ${total} — لا متبقي.`,
  approxDownloadPackageSimple: (total: string, remaining: string | null) =>
    remaining
      ? `حزمة بسيطة (النص فقط): حوالي ${total} — المتبقي: ${remaining}`
      : `حزمة بسيطة (النص فقط): حوالي ${total} — لا متبقي.`,
  approxDownloadPackageNote:
    'تقدير تقريبي لحجم البيانات عبر الشبكة؛ يختلف حسب الضغط والاستجابة.',
  refreshEstimate: 'تحديث التقدير',
  clearAllDownloads: 'مسح كل البيانات المنزّلة',
  downloadAllSurahs: 'تنزيل كل السور',
  downloadFullPackage: 'تحميل الحزمة كاملة',
  downloadFullPackageDesc:
    'نص القرآن مع تفسير الميسر فقط لكل سورة غير محفوظة. يستغرق وقتاً ويستهلك بياناتاً أكثر من الحزمة البسيطة.',
  downloadSimplePackage: 'تحميل حزمة بسيطة',
  downloadSimplePackageDesc:
    'نص الآيات فقط، دون تفسير ولا أي محتوى آخر. أسرع وأخفّ على التخزين والبيانات.',
  startBulkDownload: 'ابدأ التنزيل',
  downloadFullPackageConfirmTitle: 'تنزيل الحزمة الكاملة؟',
  downloadFullPackageConfirmMessage:
    'سيتم تنزيل نص السور مع تفسير الميسر فقط. تأكد من اتصال مستقر.',
  downloadSimplePackageConfirmTitle: 'تنزيل الحزمة البسيطة؟',
  downloadSimplePackageConfirmMessage:
    'سيتم تنزيل نص الآيات فقط للسور غير المحفوظة، دون أي تفسير.',
  stopDownload: 'إيقاف التنزيل',
  downloadAllUpToDate: 'جميع السور منزّلة مسبقاً.',
  downloadAllSomeFailed: (n: number) =>
    `تعذر تنزيل ${n} سورة. يمكنك المحاولة لاحقاً من شاشة السورة.`,
  about: 'حول',
  appName: 'quran',
  aboutDesc: (y: string) => `القرآن والتفسير محفوظان محلياً · ${y}`,
  version: 'الإصدار',
  removeAllTitle: 'حذف كل التنزيلات؟',
  removeAllMessage:
    'ستُحذف بيانات القرآن المحفوظة والتفسير المخبأ من هذا الجهاز.',
  cancel: 'إلغاء',
  delete: 'حذف',
  filterSurahs: 'تصفية السور',
  ayahA11y: (n: number) => `آية ${n}`,
  tafsirLongPressHint: 'اضغط مع الاستمرار لعرض التفسير',
  surahA11y: (num: number, enName: string) => `سورة ${num}، ${enName}`,
  loadingLabel: 'جارٍ التحميل',
  offlineConnectToDownload: 'أنت غير متصل. اتصل بالإنترنت ثم نزّل السورة.',
} as const;
