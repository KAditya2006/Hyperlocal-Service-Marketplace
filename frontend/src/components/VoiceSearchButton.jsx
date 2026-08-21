import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useSpeech from '../hooks/useSpeech';
import { loadI18nLanguage } from '../i18n';
import { normalizeServiceSearch } from '../utils/multilingualSearch';
import { detectSpokenLanguage, getVoiceSearchFeedback } from '../utils/voiceLanguage';

const VoiceSearchButton = ({ onTranscript, onAutoProceed, autoProceed = false, speakText, className = '' }) => {
  const { t, i18n } = useTranslation();
  const { listening, startListening, speak, voiceSupported, speechSupported } = useSpeech();
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  const handleTranscript = React.useCallback(async (text) => {
    const spokenLanguage = detectSpokenLanguage(text, currentLanguage);
    const normalizedQuery = normalizeServiceSearch(text);
    const voiceContext = { language: spokenLanguage, normalizedQuery };

    try {
      await loadI18nLanguage(spokenLanguage);
      await i18n.changeLanguage(spokenLanguage);
    } catch {
      // Fallback language handling stays inside i18next; the voice action should still continue.
    }

    const feedback = getVoiceSearchFeedback(text, spokenLanguage);
    toast.success(feedback);
    onTranscript?.(text, voiceContext);

    if (speechSupported) {
      speak(feedback, spokenLanguage);
    }

    if (autoProceed) {
      onAutoProceed?.(text, voiceContext);
    }
  }, [autoProceed, currentLanguage, i18n, onAutoProceed, onTranscript, speak, speechSupported]);

  const handleVoice = () => {
    if (!voiceSupported) {
      toast.error(t('voice.voiceUnsupported'));
      return;
    }

    startListening({
      languageCode: currentLanguage,
      onResult: (text) => {
        void handleTranscript(text);
      },
      onError: (message) => toast.error(message)
    });
  };

  const handleSpeak = () => {
    if (!speechSupported) {
      toast.error(t('voice.speechUnsupported'));
      return;
    }

    speak(speakText || t('voice.voiceSearch'), currentLanguage);
  };

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleVoice}
        className={`grid h-10 w-10 place-items-center rounded-xl border font-bold transition ${
          listening
            ? 'border-rose-200 bg-rose-50 text-rose-600'
            : 'border-slate-200 bg-white text-slate-600 hover:text-primary-600'
        }`}
        title={listening ? t('voice.listening') : t('voice.voiceSearch')}
        aria-label={listening ? t('voice.listening') : t('voice.voiceSearch')}
      >
        <Mic size={17} />
      </button>
      <button
        type="button"
        onClick={handleSpeak}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-primary-600"
        title={t('voice.speak')}
        aria-label={t('voice.speak')}
      >
        <Volume2 size={17} />
      </button>
    </span>
  );
};

export default VoiceSearchButton;
