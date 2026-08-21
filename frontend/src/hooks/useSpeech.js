import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageMeta } from '../i18n/languages';

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition;

const findSpeechVoice = (speechLang) => {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const normalizedSpeechLang = String(speechLang || '').toLowerCase();
  const baseLanguage = normalizedSpeechLang.split('-')[0];

  return voices.find((voice) => voice.lang.toLowerCase() === normalizedSpeechLang) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${baseLanguage}-`)) ||
    null;
};

export const useSpeech = () => {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);

  const resolveSpeechLanguage = React.useCallback((languageCode) => {
    return getLanguageMeta(languageCode || i18n.resolvedLanguage || i18n.language).speech;
  }, [i18n.language, i18n.resolvedLanguage]);

  const speechLang = resolveSpeechLanguage();

  const startListening = React.useCallback(({ onResult, onError, languageCode, speechLanguage } = {}) => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      onError?.(t('voice.voiceUnsupported'));
      return false;
    }

    const selectedSpeechLang = speechLanguage || resolveSpeechLanguage(languageCode);
    const recognition = new SpeechRecognition();
    recognition.lang = selectedSpeechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      onError?.(t('voice.voiceUnsupported'));
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) onResult?.(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [resolveSpeechLanguage, t]);

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = React.useCallback((text, languageCode) => {
    if (!window.speechSynthesis) return false;

    const selectedSpeechLang = resolveSpeechLanguage(languageCode);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedSpeechLang;
    const voice = findSpeechVoice(selectedSpeechLang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  }, [resolveSpeechLanguage]);

  return {
    listening,
    speechLang,
    startListening,
    stopListening,
    speak,
    voiceSupported: Boolean(getSpeechRecognition()),
    speechSupported: Boolean(window.speechSynthesis)
  };
};

export default useSpeech;
