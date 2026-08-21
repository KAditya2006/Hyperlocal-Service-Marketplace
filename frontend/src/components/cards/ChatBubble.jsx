import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

export const ChatBubble = ({
  message,
  isOwn = false,
  className = ''
}) => {
  if (!message) return null;

  const time = message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : '';
  const isRead = Boolean(message.readBy && message.readBy.length > 0);
  const isDelivered = Boolean(message.deliveredTo && message.deliveredTo.length > 0);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`p-3.5 sm:p-4 rounded-2xl elevation-1 break-words text-sm font-medium ${
            isOwn
              ? 'bg-primary-600 text-white rounded-tr-none'
              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
          }`}
        >
          {message.messageType === 'image' && message.imageUrl ? (
            <div className="rounded-xl overflow-hidden mb-1.5 border border-black/10">
              <img
                src={message.imageUrl}
                alt="Chat attachment"
                className="max-h-60 w-auto object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <p className="whitespace-pre-wrap">{message.content}</p>

          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold ${
              isOwn ? 'text-primary-100' : 'text-slate-400'
            }`}
          >
            <span>{time}</span>
            {isOwn && (
              <span>
                {isRead ? (
                  <CheckCheck size={13} className="text-emerald-300" title="Read" />
                ) : isDelivered ? (
                  <CheckCheck size={13} className="text-primary-200" title="Delivered" />
                ) : (
                  <Check size={13} className="text-primary-200" title="Sent" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
