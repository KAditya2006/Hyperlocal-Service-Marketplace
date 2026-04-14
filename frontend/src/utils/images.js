export const fallbackAvatar = '/avatar.svg';

export const withImageFallback = (fallbackSrc = fallbackAvatar) => (event) => {
  if (event.currentTarget.src.endsWith(fallbackSrc)) return;
  event.currentTarget.src = fallbackSrc;
};
