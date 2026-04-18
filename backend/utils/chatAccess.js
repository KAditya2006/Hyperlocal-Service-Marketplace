const getRequesterId = (requester) => requester?._id || requester?.id;

const canInitiateChat = async ({
  requester,
  recipientId,
  workerProfileExists,
  bookingExists
}) => {
  if (!requester || !recipientId) return false;
  if (requester.role === 'admin') return true;

  if (requester.role === 'user') {
    if (!workerProfileExists) return false;
    return Boolean(await workerProfileExists({
      user: recipientId,
      approvalStatus: 'approved'
    }));
  }

  if (requester.role === 'worker') {
    const requesterId = getRequesterId(requester);
    if (!requesterId || !bookingExists) return false;
    return Boolean(await bookingExists({
      worker: requesterId,
      user: recipientId
    }));
  }

  return false;
};

module.exports = {
  canInitiateChat
};
