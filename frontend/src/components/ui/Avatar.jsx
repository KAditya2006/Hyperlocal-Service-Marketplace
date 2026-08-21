import { fallbackAvatar, withImageFallback } from '../../utils/images';
import { getPresenceDotClass } from '../../utils/presence';

const SIZES = {
  xs: 'w-7 h-7 rounded-lg text-xs',
  sm: 'w-9 h-9 rounded-xl text-xs',
  md: 'w-11 h-11 rounded-xl text-sm',
  lg: 'w-14 h-14 rounded-2xl text-base',
  xl: 'w-20 h-20 rounded-3xl text-xl'
};

const DOT_SIZES = {
  xs: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
  sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border',
  md: 'w-3 h-3 -bottom-0.5 -right-0.5 border-2',
  lg: 'w-3.5 h-3.5 -bottom-1 -right-1 border-2',
  xl: 'w-4.5 h-4.5 -bottom-1 -right-1 border-2'
};

export const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md',
  isOnline,
  showPresence = false,
  className = '',
  imgClassName = ''
}) => {
  const sizeClass = SIZES[size] || SIZES.md;
  const dotSizeClass = DOT_SIZES[size] || DOT_SIZES.md;

  return (
    <div className={`relative shrink-0 select-none ${sizeClass} ${className}`}>
      <img
        src={src || fallbackAvatar}
        onError={withImageFallback()}
        alt={alt}
        className={`w-full h-full object-cover border border-slate-100/80 ${sizeClass} ${imgClassName}`}
      />

      {showPresence && typeof isOnline === 'boolean' && (
        <div
          className={`absolute ${dotSizeClass} ${getPresenceDotClass(isOnline)} border-white rounded-full`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
