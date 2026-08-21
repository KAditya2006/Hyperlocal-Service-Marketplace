const getRequesterId = (requester) => requester?._id || requester?.id;

const canInitiateChat = async ({
  requester,
  recipientId,
  userExists
}) => {
  if (!requester || !recipientId) return false;

  const requesterId = String(getRequesterId(requester));
  const targetId = String(recipientId);

  // Cannot chat with self
  if (requesterId === targetId) return false;

  const allowedRoles = ['user', 'worker', 'admin'];
  if (!allowedRoles.includes(requester.role)) return false;

  if (typeof userExists === 'function') {
    const exists = await userExists(targetId);
    if (!exists) return false;
  }

  // All role combinations supported: User<->User, User<->Worker, Worker<->User, Worker<->Worker, Admin<->Any
  return true;
};

module.exports = {
  canInitiateChat
};
