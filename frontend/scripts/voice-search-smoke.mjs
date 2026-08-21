import { detectSpokenLanguage, getVoiceSearchFeedback } from '../src/utils/voiceLanguage.js';
import { normalizeServiceSearch } from '../src/utils/multilingualSearch.js';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const cases = [
  ['प्लंबर', 'en', 'hi'],
  ['প্লাম্বার', 'en', 'bn'],
  ['ప్లంబర్', 'en', 'te'],
  ['پلمبر', 'en', 'ur'],
  ['plumber', 'hi', 'en'],
  ['प्लंबर', 'mr', 'mr']
];

cases.forEach(([text, fallback, expected]) => {
  assert(
    detectSpokenLanguage(text, fallback) === expected,
    `Expected "${text}" with fallback "${fallback}" to resolve to "${expected}"`
  );
});

const feedback = getVoiceSearchFeedback('प्लंबर', 'hi');
assert(feedback.includes('प्लंबर'), 'Voice feedback should include the spoken query');

const searchCases = [
  ['प्लंबर', 'plumber'],
  ['প্লাম্বার', 'plumber'],
  ['ప్లంబర్', 'plumber'],
  ['इलेक्ट्रिशियन', 'electrician'],
  ['ଇଲେକ୍ଟ୍ରିସିଆନ', 'electrician']
];

searchCases.forEach(([query, expected]) => {
  assert(
    normalizeServiceSearch(query) === expected,
    `Expected service query "${query}" to normalize to "${expected}"`
  );
});

console.log('ok - voice language detection and multilingual search normalization passed');
