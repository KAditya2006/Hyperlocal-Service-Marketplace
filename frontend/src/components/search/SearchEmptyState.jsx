import { Search as SearchIcon } from 'lucide-react';
import { formatServiceLabel } from '../../utils/serviceSearch';

const SearchEmptyState = ({ searchedService, searchedServiceIsListed, suggestedServices, onSearchService, t }) => {
  return (
    <div className="md:col-span-2 xl:col-span-3 bg-white rounded-3xl p-6 sm:p-10 text-center border border-slate-100 premium-shadow">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center mb-5">
        <SearchIcon size={26} />
      </div>
      <p className="font-bold text-slate-800 text-xl">
        {searchedService && !searchedServiceIsListed
          ? t('search.noServiceYet', { service: searchedService })
          : t('search.noWorkers')}
      </p>
      <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
        {searchedService && !searchedServiceIsListed
          ? t('search.tryListed')
          : t('search.tryAnother')}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
        {suggestedServices.map((service) => (
          <button
            key={service}
            type="button"
            onClick={() => onSearchService(service)}
            className="px-4 py-2 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 font-bold hover:bg-primary-100 transition-colors"
          >
            {t(`services.${service}`, { defaultValue: formatServiceLabel(service) })}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchEmptyState;
