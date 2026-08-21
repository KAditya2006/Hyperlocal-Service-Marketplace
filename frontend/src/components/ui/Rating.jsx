import { Star } from 'lucide-react';

export const Rating = ({
  rating,
  totalReviews,
  size = 'md',
  showCount = true,
  interactive = false,
  onChange,
  className = ''
}) => {
  const numRating = typeof rating === 'number' && Number.isFinite(rating) ? rating : 0;
  const isNew = numRating === 0;

  const starSizes = {
    sm: 12,
    md: 14,
    lg: 18
  };

  const starSize = starSizes[size] || starSizes.md;

  if (interactive) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= numRating;
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange && onChange(starValue)}
              className="p-1 text-amber-400 hover:text-amber-500 hover:scale-110 transition-transform cursor-pointer"
            >
              <Star
                size={starSize + 4}
                fill={isFilled ? 'currentColor' : 'none'}
                className={isFilled ? 'text-amber-400' : 'text-slate-300'}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-bold text-amber-500 select-none ${className}`}>
      <Star size={starSize} fill="currentColor" className="shrink-0" />
      {isNew ? (
        <span className="text-xs font-semibold text-slate-400">New</span>
      ) : (
        <span className="text-xs sm:text-sm text-slate-900 font-bold">
          {numRating.toFixed(1)}
        </span>
      )}

      {showCount && typeof totalReviews === 'number' && totalReviews > 0 && (
        <span className="text-xs font-normal text-slate-400">
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default Rating;
