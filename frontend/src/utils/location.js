export const hasUsableCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return !(lat === 0 && lng === 0);
};

export const toStoredCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lat, lng] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lng, lat];
};

export const toLeafletCoordinates = (coordinates) => {
  if (!hasUsableCoordinates(coordinates)) return null;
  const [lng, lat] = coordinates.map(Number);
  return [lat, lng];
};

export const getBookingDestination = (booking, fallbackUser) => {
  return toLeafletCoordinates(
    booking?.serviceLocation?.coordinates ||
    booking?.user?.location?.coordinates ||
    fallbackUser?.location?.coordinates
  );
};

export const getStoredUserCoordinates = (user) => (
  hasUsableCoordinates(user?.location?.coordinates) ? user.location.coordinates : null
);
