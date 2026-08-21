import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddressAutocomplete from './AddressAutocomplete';
import { toStoredCoordinates } from '../utils/location';

const ServiceAddressInput = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('search');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'manual') {
      onChange({ address: value || '', coordinates: null });
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1 border border-slate-100">
        <button
          type="button"
          onClick={() => switchMode('search')}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${mode === 'search' ? 'bg-white text-primary-700 premium-shadow' : 'text-slate-500'}`}
        >
          {t('common.searchOnMap')}
        </button>
        <button
          type="button"
          onClick={() => switchMode('manual')}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${mode === 'manual' ? 'bg-white text-primary-700 premium-shadow' : 'text-slate-500'}`}
        >
          {t('common.enterManually')}
        </button>
      </div>

      {mode === 'search' ? (
        <AddressAutocomplete
          required
          value={value}
          onChange={({ address, coordinates }) => onChange({
            address,
            coordinates: coordinates ? toStoredCoordinates(coordinates) : null
          })}
          placeholder={t('common.addressSearchPlaceholder')}
          className="w-full"
        />
      ) : (
        <textarea
          required
          value={value}
          onChange={(event) => onChange({ address: event.target.value, coordinates: null })}
          placeholder={t('common.addressManualPlaceholder')}
          className="w-full h-28 bg-slate-50 rounded-2xl px-4 py-4 outline-none border border-slate-100 focus:border-primary-500"
        />
      )}

      <p className="text-xs font-medium text-slate-400">
        {t('common.addressMapHint')}
      </p>
    </div>
  );
};

export default ServiceAddressInput;
