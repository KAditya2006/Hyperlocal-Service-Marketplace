import { format } from 'date-fns';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

export const ChatListItem = ({
  chat,
  currentUserId,
  isSelected = false,
  onClick,
  t = (k, o) => o?.defaultValue || k,
  className = ''
}) => {
  if (!chat) return null;

  const otherParticipant = chat.participants?.find((p) => {
    const pId = p?._id || p?.id || p;
    return String(pId) !== String(currentUserId);
  }) || {};

  const unreadCount = chat.unreadCount || 0;
  const timeFormatted = chat.updatedAt ? format(new Date(chat.updatedAt), 'h:mm a') : '';

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 flex items-center gap-3.5 cursor-pointer transition-all border-l-4 select-none ${
        isSelected
          ? 'bg-primary-50/60 border-primary-600 shadow-xs'
          : 'border-transparent hover:bg-slate-50'
      } ${className}`}
    >
      <Avatar
        src={otherParticipant.avatar}
        alt={otherParticipant.name}
        size="md"
        isOnline={otherParticipant.isOnline}
        showPresence={true}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="font-bold text-slate-900 text-sm truncate">
            {otherParticipant.name || t('chat.unknownUser', { defaultValue: 'User' })}
          </h4>
          <span className="text-[10px] font-bold text-slate-400 shrink-0">
            {timeFormatted}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge status={otherParticipant.role} size="sm" />
            <p className="text-xs text-slate-500 truncate font-normal">
              {chat.lastMessage?.text || t('chat.startConversation', { defaultValue: 'Start conversation' })}
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="shrink-0 bg-primary-600 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 min-w-4.5 text-center shadow-xs">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
