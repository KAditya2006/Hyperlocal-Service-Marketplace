const { PRESENCE_STALE_MS, getId, isUserOnline, attachPresence } = require('../utils/presence');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const freshTimestamp = () => new Date(Date.now() - 5 * 1000).toISOString();
const staleTimestamp = () => new Date(Date.now() - PRESENCE_STALE_MS - 5 * 1000).toISOString();

assert(getId({ _id: 42 }) === '42', 'getId should prefer _id values');
assert(getId('abc') === 'abc', 'getId should stringify plain ids');
assert(getId(null) === null, 'getId should return null for empty values');

assert(
  isUserOnline({ _id: 'socket-user' }, new Set(['socket-user'])) === true,
  'Socket-connected users should be treated as online'
);

assert(
  isUserOnline({ _id: 'fresh-db', isOnline: true, presenceUpdatedAt: freshTimestamp() }, new Set()) === true,
  'Fresh persisted presence should be treated as online'
);

assert(
  isUserOnline({ _id: 'stale-db', isOnline: true, presenceUpdatedAt: staleTimestamp() }, new Set()) === false,
  'Stale persisted presence should be treated as offline'
);

const attached = attachPresence(
  { _id: 'viewer-1', isOnline: true, presenceUpdatedAt: freshTimestamp(), lastSeenAt: '2026-04-20T10:00:00.000Z' },
  new Set()
);

assert(attached.isOnline === true, 'attachPresence should attach resolved online state');
assert(attached.lastSeenAt === '2026-04-20T10:00:00.000Z', 'attachPresence should preserve lastSeenAt');

console.log('ok - presence helpers resolve live, stale, and socket-driven presence correctly');
