import { getLanguageMeta } from '../i18n/languages.js';

const DEVANAGARI_LANGUAGES = ['hi', 'mr', 'mai', 'ne', 'kok', 'doi', 'brx'];
const BENGALI_SCRIPT_LANGUAGES = ['bn', 'as'];
const ARABIC_SCRIPT_LANGUAGES = ['ur', 'ks', 'sd'];

const preferFallbackLanguage = (fallbackLanguage, candidates, defaultLanguage) => {
  const fallbackCode = getLanguageMeta(fallbackLanguage).code;
  return candidates.includes(fallbackCode) ? fallbackCode : defaultLanguage;
};

export const detectSpokenLanguage = (text, fallbackLanguage = 'en') => {
  const value = String(text || '').trim();
  if (!value) return getLanguageMeta(fallbackLanguage).code;

  if (/[\u0C00-\u0C7F]/.test(value)) return 'te';
  if (/[\u0B80-\u0BFF]/.test(value)) return 'ta';
  if (/[\u0A80-\u0AFF]/.test(value)) return 'gu';
  if (/[\u0C80-\u0CFF]/.test(value)) return 'kn';
  if (/[\u0B00-\u0B7F]/.test(value)) return 'or';
  if (/[\u0D00-\u0D7F]/.test(value)) return 'ml';
  if (/[\u0A00-\u0A7F]/.test(value)) return 'pa';
  if (/[\u1C50-\u1C7F]/.test(value)) return 'sat';
  if (/[\uABC0-\uABFF]/.test(value)) return 'mni';
  if (/[\u0980-\u09FF]/.test(value)) {
    return preferFallbackLanguage(fallbackLanguage, BENGALI_SCRIPT_LANGUAGES, 'bn');
  }
  if (/[\u0600-\u06FF]/.test(value)) {
    return preferFallbackLanguage(fallbackLanguage, ARABIC_SCRIPT_LANGUAGES, 'ur');
  }
  if (/[\u0900-\u097F]/.test(value)) {
    return preferFallbackLanguage(fallbackLanguage, DEVANAGARI_LANGUAGES, 'hi');
  }
  if (/[a-z]/i.test(value)) return 'en';

  return getLanguageMeta(fallbackLanguage).code;
};

const VOICE_SEARCH_FEEDBACK = {
  en: (text) => `Searching for ${text}.`,
  hi: (text) => `मैं ${text} खोज रहा हूं।`,
  bn: (text) => `আমি ${text} খুঁজছি।`,
  te: (text) => `నేను ${text} కోసం వెతుకుతున్నాను.`,
  mr: (text) => `मी ${text} शोधत आहे.`,
  ta: (text) => `நான் ${text} தேடுகிறேன்.`,
  ur: (text) => `میں ${text} تلاش کر رہا ہوں۔`,
  gu: (text) => `હું ${text} શોધી રહ્યો છું.`,
  kn: (text) => `ನಾನು ${text} ಹುಡುಕುತ್ತಿದ್ದೇನೆ.`,
  or: (text) => `ମୁଁ ${text} ଖୋଜୁଛି।`,
  ml: (text) => `ഞാൻ ${text} തിരയുന്നു.`,
  pa: (text) => `ਮੈਂ ${text} ਲੱਭ ਰਿਹਾ ਹਾਂ।`,
  as: (text) => `মই ${text} বিচাৰি আছোঁ।`,
  mai: (text) => `हम ${text} खोजि रहल छी।`,
  sat: (text) => `ᱤᱧ ${text} ᱥᱮᱸᱫᱽᱨᱟ ᱠᱟᱱᱟ।`,
  ks: (text) => `بہ ${text} ژھانڈان چھس۔`,
  ne: (text) => `म ${text} खोज्दै छु।`,
  kok: (text) => `हांव ${text} सोदतां।`,
  sd: (text) => `مان ${text} ڳولي رهيو آهيان.`,
  doi: (text) => `मैं ${text} खोज करदा आं।`,
  mni: (text) => `ꯑꯩ ${text} ꯊꯤꯔꯤ।`,
  brx: (text) => `आं ${text} नागिरगासिनो दं।`
};

export const getVoiceSearchFeedback = (text, languageCode = 'en') => {
  const code = getLanguageMeta(languageCode).code;
  return (VOICE_SEARCH_FEEDBACK[code] || VOICE_SEARCH_FEEDBACK.en)(text);
};
