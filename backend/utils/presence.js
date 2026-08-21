const PRESENCE_STALE_MS = 2 * 60 * 1000;

const getId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const isPresenceFresh = (user) => {
  const updatedAt = user?.presenceUpdatedAt ? new Date(user.presenceUpdatedAt).getTime() : 0;
  if (!updatedAt) return false;
  return Date.now() - updatedAt <= PRESENCE_STALE_MS;
};

const isUserOnline = (user, onlineUserIds = new Set()) => {
  const userId = getId(user);
  if (!userId) return false;
  if (onlineUserIds.has(userId)) return true;
  return Boolean(user?.isOnline && isPresenceFresh(user));
};

const attachPresence = (user, onlineUserIds = new Set()) => ({
  ...user,
  isOnline: isUserOnline(user, onlineUserIds),
  lastSeenAt: user?.lastSeenAt || null
});

module.exports = {
  PRESENCE_STALE_MS,
  getId,
  isUserOnline,
  attachPresence
};
