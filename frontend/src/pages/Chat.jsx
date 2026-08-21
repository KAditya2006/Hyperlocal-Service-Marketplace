import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getChats,
  getMessages,
  initiateChat,
  markChatRead,
  searchChatContacts,
  sendTextMessage,
  uploadImageMessage
} from '../services/api';
import {
  disconnectSocket,
  initiateSocket,
  joinChatRoom,
  subscribeToMessageStatus,
  subscribeToMessages,
  subscribeToNotifications,
  subscribeToPresence
} from '../services/socket';
import Navbar from '../components/Navbar';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Search,
  Check,
  CheckCheck,
  Loader2,
  Plus,
  X,
  User as UserIcon,
  Briefcase,
  Shield,
  Star,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fallbackAvatar, withImageFallback } from '../utils/images';
import { getPresenceDotClass } from '../utils/presence';
import { getWorkerAvailabilityClass } from '../utils/workerAvailability';
import UserProfileModal from '../components/chat/UserProfileModal';

const getReferenceId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
};

const getMessageSenderId = (message) => getReferenceId(message?.sender);

const hasReference = (values = [], targetId) => {
  const normalizedTarget = String(targetId);
  return values.some((value) => getReferenceId(value) === normalizedTarget);
};

const mergeReference = (values = [], nextValue) => {
  if (!nextValue) return values || [];
  const nextId = getReferenceId(nextValue);
  if (!nextId || hasReference(values, nextId)) return values || [];
  return [...(values || []), nextId];
};

const getOtherParticipantIds = (chat, userId) => {
  return (chat?.participants || [])
    .map(getReferenceId)
    .filter((participantId) => participantId && participantId !== String(userId));
};

const getOtherParticipant = (chat, userId) => {
  return chat?.participants?.find((participant) => getReferenceId(participant) !== String(userId));
};

const getMessageReceipt = (message, chat, userId) => {
  const recipientIds = getOtherParticipantIds(chat, userId);
  const wasRead = recipientIds.some((recipientId) => hasReference(message.readBy || [], recipientId));
  if (wasRead) return 'read';

  const wasDelivered = recipientIds.some((recipientId) => hasReference(message.deliveredTo || [], recipientId));
  if (wasDelivered) return 'delivered';

  return 'sent';
};

const RoleBadge = ({ role }) => {
  if (role === 'worker') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
        <Briefcase size={10} /> Worker
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-100">
        <Shield size={10} /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
      <UserIcon size={10} /> User
    </span>
  );
};

const ChatPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [messagePagination, setMessagePagination] = useState({ page: 1, pages: 1 });
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  
  // New Chat Modal States
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactRole, setContactRole] = useState('all');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [viewingUserProfileId, setViewingUserProfileId] = useState(null);

  const scrollRef = useRef();
  const activeChatRef = useRef(null);
  const chatsRef = useRef([]);
  const initialChatLoadedRef = useRef(false);
  const params = useParams();
  const initialChatId = params?.chatId || location.state?.chatId || new URLSearchParams(location.search).get('chatId');

  const appendMessage = useCallback((message) => {
    setMessages((previousMessages) => {
      if (previousMessages.some((currentMessage) => currentMessage._id === message._id)) {
        return previousMessages;
      }
      return [...previousMessages, message];
    });
  }, []);

  const updateMessageReceipts = useCallback((statusUpdate) => {
    const messageIds = (statusUpdate.messageIds || []).map(String);
    if (!messageIds.length) return;

    setMessages((previousMessages) => previousMessages.map((message) => {
      if (!messageIds.includes(String(message._id))) return message;

      return {
        ...message,
        deliveredTo: mergeReference(message.deliveredTo || [], statusUpdate.deliveredTo),
        readBy: mergeReference(message.readBy || [], statusUpdate.readBy)
      };
    }));
  }, []);

  const syncPresenceFromChats = useCallback((chatList) => {
    setOnlineUserIds(() => {
      const nextOnlineUserIds = new Set();
      chatList.forEach((chat) => {
        chat.participants?.forEach((participant) => {
          const participantId = getReferenceId(participant);
          if (participantId && participant.isOnline) {
            nextOnlineUserIds.add(participantId);
          }
        });
      });
      return nextOnlineUserIds;
    });
  }, []);

  const isParticipantOnline = useCallback((participant) => {
    const participantId = getReferenceId(participant);
    return Boolean(participantId && onlineUserIds.has(participantId));
  }, [onlineUserIds]);

  const markActiveChatRead = useCallback(async (chatId) => {
    try {
      await markChatRead(chatId);
      setChats((prevChats) =>
        prevChats.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      // Reading receipts should never interrupt the chat experience.
    }
  }, []);

  const handleChatSelect = useCallback(async (chat) => {
    setActiveChat(chat);
    setMsgLoading(true);
    joinChatRoom(chat._id);

    // Clear unread badge locally for this chat
    setChats((prevChats) =>
      prevChats.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
    );

    try {
      const { data } = await getMessages(chat._id);
      setMessages(data.data);
      setMessagePagination(data.pagination);
      await markActiveChatRead(chat._id);
    } catch {
      toast.error(t('chat.failedLoadMessages'));
    } finally {
      setMsgLoading(false);
    }
  }, [markActiveChatRead, t]);

  const fetchChats = useCallback(async () => {
    try {
      const { data } = await getChats();
      const chatList = data.data;
      setChats(chatList);
      syncPresenceFromChats(chatList);

      if (!initialChatLoadedRef.current && initialChatId) {
        const initialChat = chatList.find((chat) => chat._id === initialChatId);
        if (initialChat) {
          initialChatLoadedRef.current = true;
          await handleChatSelect(initialChat);
        }
      }
    } catch {
      toast.error(t('chat.failedLoadChats'));
    } finally {
      setLoading(false);
    }
  }, [handleChatSelect, initialChatId, syncPresenceFromChats, t]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    initiateSocket();
    fetchChats();

    const unsubscribeMessages = subscribeToMessages((err, msg) => {
      if (activeChatRef.current && String(msg.chatId) === String(activeChatRef.current._id)) {
        appendMessage(msg);
        if (getMessageSenderId(msg) !== String(user.id)) {
          markActiveChatRead(activeChatRef.current._id);
        }
      }
      fetchChats(); // Update last message & unread in sidebar
    });

    const unsubscribeMessageStatus = subscribeToMessageStatus((err, statusUpdate) => {
      if (activeChatRef.current && String(statusUpdate.chatId) === String(activeChatRef.current._id)) {
        updateMessageReceipts(statusUpdate);
      }
    });

    const unsubscribePresence = subscribeToPresence((err, presence) => {
      setOnlineUserIds((currentOnlineUserIds) => {
        const nextOnlineUserIds = new Set(currentOnlineUserIds);
        if (presence.isOnline) {
          nextOnlineUserIds.add(String(presence.userId));
        } else {
          nextOnlineUserIds.delete(String(presence.userId));
        }
        return nextOnlineUserIds;
      });
    });

    const unsubscribeNotifications = subscribeToNotifications((err, notif) => {
      if (!activeChatRef.current || String(notif.chatId) !== String(activeChatRef.current._id)) {
        toast((tToast) => (
          <div
            onClick={() => {
              const chat = chatsRef.current.find((c) => String(c._id) === String(notif.chatId));
              if (chat) handleChatSelect(chat);
              toast.dismiss(tToast.id);
            }}
            className="cursor-pointer"
          >
            <p className="font-bold flex items-center gap-2">
              <MessageSquare size={16} /> {notif.senderName}
            </p>
            <p className="text-sm opacity-80">{notif.text}</p>
          </div>
        ), { duration: 4000 });
      }
    });

    return () => {
      unsubscribeMessages?.();
      unsubscribeMessageStatus?.();
      unsubscribeNotifications?.();
      unsubscribePresence?.();
      disconnectSocket();
    };
  }, [appendMessage, fetchChats, handleChatSelect, markActiveChatRead, updateMessageReceipts, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load Contacts when New Chat modal opens or filter changes
  useEffect(() => {
    if (!showNewChatModal) return;

    let isMounted = true;
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const params = {};
        if (contactSearch.trim()) params.q = contactSearch.trim();
        if (contactRole !== 'all') params.role = contactRole;

        const { data } = await searchChatContacts(params);
        if (isMounted) {
          setContacts(data.data || []);
        }
      } catch {
        if (isMounted) setContacts([]);
      } finally {
        if (isMounted) setLoadingContacts(false);
      }
    };

    const debounce = setTimeout(fetchContacts, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [showNewChatModal, contactSearch, contactRole]);

  const loadOlderMessages = async () => {
    if (!activeChat || messagePagination.page >= messagePagination.pages) return;

    try {
      const nextPage = messagePagination.page + 1;
      const { data } = await getMessages(activeChat._id, { page: nextPage });
      setMessages((current) => [...data.data, ...current]);
      setMessagePagination(data.pagination);
    } catch {
      toast.error(t('chat.failedLoadOlder'));
    }
  };

  const handleStartNewChat = async (contact) => {
    setStartingChat(true);
    try {
      const { data } = await initiateChat({ recipientId: contact._id });
      const targetChat = data.data;

      setShowNewChatModal(false);
      setContactSearch('');

      // Refresh chat list to include new chat or update existing
      await fetchChats();
      await handleChatSelect(targetChat);
    } catch (error) {
      toast.error(error.response?.data?.message || t('search.couldNotStartChat'));
    } finally {
      setStartingChat(false);
    }
  };

  const handleDiscussWorker = (worker, service) => {
    setViewingUserProfileId(null);
    const serviceName = t(`services.${service}`, { defaultValue: service });
    const promptMessage = t('chat.discussWorkerPrompt', {
      workerName: worker?.name,
      serviceName,
      defaultValue: `Hi! I saw you booked ${worker?.name} for ${serviceName}. How was your experience with them?`
    });
    setText(promptMessage);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const content = text.trim();
    setText('');

    try {
      const { data } = await sendTextMessage(activeChat._id, { content });
      appendMessage(data.data);
      fetchChats();
    } catch (error) {
      setText(content);
      toast.error(error.response?.data?.message || t('chat.messageNotSaved'));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(t('chat.sendingImage'));
    const formData = new FormData();
    formData.append('image', file);
    formData.append('chatId', activeChat._id);

    try {
      const { data } = await uploadImageMessage(formData);
      appendMessage(data.data);
      fetchChats();
      toast.success(t('chat.imageSent'), { id: toastId });
    } catch {
      toast.error(t('chat.failedSendImage'), { id: toastId });
    }
  };

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = getOtherParticipant(chat, user.id);
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderReceipt = (message) => {
    const receipt = getMessageReceipt(message, activeChat, user.id);

    if (receipt === 'read') {
      return <CheckCheck size={14} className="text-emerald-500" title={t('chat.read')} />;
    }

    if (receipt === 'delivered') {
      return <CheckCheck size={14} className="text-slate-400" title={t('chat.delivered')} />;
    }

    return <Check size={14} className="text-slate-400" title={t('chat.sent')} />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">{t('chat.loadingConversations')}</div>;

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-slate-50 md:overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden p-3 sm:p-6 gap-4 sm:gap-6 min-h-0 min-w-0">
        {/* Chat List Sidebar */}
        <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] md:shrink-0 bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 flex-col overflow-hidden min-h-[60vh] md:min-h-0 min-w-0`}>
          <div className="p-4 sm:p-6 border-b border-slate-50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold font-heading text-slate-900">{t('chat.messages')}</h1>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-200"
              >
                <Plus size={16} />
                <span>{t('chat.newChat', { defaultValue: 'New Chat' })}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('chat.searchConversations')}
                className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat, user.id);
                const otherParticipantOnline = isParticipantOnline(otherParticipant);
                const isSelected = activeChat?._id === chat._id;
                const unreadCount = chat.unreadCount || 0;

                return (
                  <div
                    key={chat._id}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all border-l-4 min-w-0 ${
                      isSelected ? 'bg-primary-50/50 border-primary-600 shadow-sm' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={otherParticipant?.avatar || fallbackAvatar}
                        onError={withImageFallback()}
                        alt={t('chat.participantAvatar')}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-white premium-shadow"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${getPresenceDotClass(otherParticipantOnline)} border-2 border-white rounded-full`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1 gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                            {otherParticipant?.name || t('chat.unknownUser', { defaultValue: 'User' })}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                          {chat.updatedAt ? format(new Date(chat.updatedAt), 'h:mm a') : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <RoleBadge role={otherParticipant?.role} />
                          <p className="text-xs font-medium text-slate-500 truncate italic">
                            {chat.lastMessage?.text || t('chat.startConversation')}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="shrink-0 bg-primary-600 text-white text-[11px] font-black rounded-full px-2 py-0.5 min-w-5 text-center shadow-sm">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 sm:p-12 text-center text-slate-400 space-y-3">
                <MessageSquare size={36} className="mx-auto text-slate-300" />
                <p className="font-bold">{t('chat.noMessages')}</p>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary-50 text-primary-600 text-xs font-bold hover:bg-primary-100 transition-colors"
                >
                  {t('chat.startNewChat', { defaultValue: '+ Start a New Chat' })}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 flex-col overflow-hidden relative min-h-[75svh] md:min-h-0 min-w-0`}>
          {activeChat ? (
            (() => {
              const activeParticipant = getOtherParticipant(activeChat, user.id);
              const activeParticipantOnline = isParticipantOnline(activeParticipant);

              return (
                <>
                  {/* Window Header */}
                  <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-50 flex justify-between items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div
                      onClick={() => {
                        if (activeParticipant?.role === 'user') {
                          setViewingUserProfileId(activeParticipant._id);
                        } else if (activeParticipant?.role === 'worker') {
                          navigate(`/workers/${activeParticipant._id}`);
                        }
                      }}
                      className="flex min-w-0 items-center gap-3 sm:gap-4 cursor-pointer group"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChat(null);
                        }}
                        className="md:hidden text-slate-400 font-bold text-xl px-1"
                      >
                        {t('chat.back')}
                      </button>
                      <img
                        src={activeParticipant?.avatar || fallbackAvatar}
                        onError={withImageFallback()}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100 group-hover:ring-2 group-hover:ring-primary-400 transition-all"
                        alt={t('chat.activeAvatar')}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate group-hover:text-primary-600 transition-colors">
                            {activeParticipant?.name}
                          </h3>
                          <RoleBadge role={activeParticipant?.role} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 ${getPresenceDotClass(activeParticipantOnline)} rounded-full ${activeParticipantOnline ? 'animate-pulse' : ''}`}></div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {activeParticipantOnline ? t('chat.activeNow') : t('chat.offline')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Header Profile Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeParticipant?.role === 'user' && (
                        <button
                          type="button"
                          onClick={() => setViewingUserProfileId(activeParticipant._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 text-xs font-bold transition-all border border-slate-200/70 shadow-xs"
                          title={t('chat.viewProfile', { defaultValue: 'View Profile' })}
                        >
                          <UserIcon size={14} />
                          <span className="hidden sm:inline">{t('chat.viewProfile', { defaultValue: 'View Profile' })}</span>
                        </button>
                      )}
                      {activeParticipant?.role === 'worker' && (
                        <Link
                          to={`/workers/${activeParticipant._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 text-xs font-bold transition-all border border-slate-200/70 shadow-xs"
                        >
                          <Briefcase size={14} />
                          <span className="hidden sm:inline">{t('chat.viewWorkerProfile', { defaultValue: 'Worker Profile' })}</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Message Feed */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 custom-scrollbar bg-slate-50/20">
                    {msgLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                      </div>
                    ) : (
                      <>
                        {messagePagination.page < messagePagination.pages && (
                          <div className="text-center">
                            <button
                              onClick={loadOlderMessages}
                              className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 shadow-sm"
                            >
                              {t('chat.loadOlder')}
                            </button>
                          </div>
                        )}
                        {messages.length === 0 && (
                          <div className="text-center text-slate-400 py-12">
                            <p className="font-medium text-sm">{t('chat.startConversation')}</p>
                          </div>
                        )}
                        {messages.map((msg, i) => {
                          const isOwnMessage = getMessageSenderId(msg) === String(user.id);
                          return (
                            <div key={msg._id || i} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[86%] sm:max-w-[70%] space-y-1.5 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                <div
                                  className={`p-3 sm:p-4 rounded-2xl sm:rounded-[24px] premium-shadow font-medium tracking-tight break-words text-sm sm:text-base ${
                                    isOwnMessage
                                      ? 'bg-primary-600 text-white rounded-tr-none'
                                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                  }`}
                                >
                                  {msg.messageType === 'image' ? (
                                    <img
                                      src={msg.imageUrl}
                                      className="max-w-full rounded-xl cursor-pointer hover:opacity-95"
                                      alt={t('chat.sentImage')}
                                      onClick={() => window.open(msg.imageUrl, '_blank')}
                                    />
                                  ) : (
                                    msg.content
                                  )}
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                  <span>{msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}</span>
                                  {isOwnMessage && renderReceipt(msg)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={scrollRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 sm:p-6 bg-white border-t border-slate-50">
                    <form onSubmit={handleSend} className="bg-slate-50 p-2 rounded-2xl sm:rounded-[32px] border border-slate-100 flex items-center gap-1.5 sm:gap-2 premium-shadow focus-within:border-primary-400 focus-within:bg-white transition-all min-w-0">
                      <label className="p-3 text-slate-400 hover:text-primary-600 cursor-pointer transition-colors" title={t('chat.attachImage', { defaultValue: 'Attach image' })}>
                        <ImageIcon size={22} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      <input
                        type="text"
                        placeholder={t('chat.writeMessage')}
                        className="min-w-0 flex-1 bg-transparent outline-none px-2 sm:px-4 py-2 font-medium text-slate-900 text-sm sm:text-base"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={5000}
                      />
                      <button
                        type="submit"
                        disabled={!text.trim()}
                        className="bg-primary-600 text-white p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-primary-200"
                        title={t('common.send', { defaultValue: 'Send' })}
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-primary-50 rounded-[40px] flex items-center justify-center mb-6 text-primary-600 shadow-xl shadow-primary-100/50">
                <MessageSquare size={48} />
              </div>
              <h3 className="text-3xl font-bold font-heading text-slate-900 mb-2">{t('chat.selectConversation')}</h3>
              <p className="text-slate-500 font-medium max-w-xs mb-6">{t('chat.selectConversationHint')}</p>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-200"
              >
                <Plus size={18} />
                <span>{t('chat.startNewChat', { defaultValue: 'Start a New Chat' })}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Start New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[36px] premium-shadow border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('chat.newChatTitle', { defaultValue: 'Start a Conversation' })}</h3>
                  <p className="text-xs text-slate-500">{t('chat.newChatSubtitle', { defaultValue: 'Search registered users or workers' })}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 sm:p-6 border-b border-slate-50 space-y-3 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder={t('chat.searchPeople', { defaultValue: 'Search by name, phone or email...' })}
                  className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm font-medium"
                  autoFocus
                />
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: t('chat.allRoles', { defaultValue: 'All' }) },
                  { key: 'user', label: t('chat.usersOnly', { defaultValue: 'Users' }) },
                  { key: 'worker', label: t('chat.workersOnly', { defaultValue: 'Workers' }) }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setContactRole(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      contactRole === tab.key
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
              {loadingContacts ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="animate-spin text-primary-600 mr-2" size={24} />
                  <span className="text-sm font-bold">{t('common.loading')}</span>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <UserIcon size={36} className="mx-auto text-slate-300" />
                  <p className="font-bold text-sm">{t('chat.noPeopleFound', { defaultValue: 'No users or workers found' })}</p>
                  <p className="text-xs">{t('chat.tryDifferentQuery', { defaultValue: 'Try searching with another name or filter.' })}</p>
                </div>
              ) : (
                contacts.map((contact) => {
                  const isOnline = isParticipantOnline(contact);
                  const isWorker = contact.role === 'worker';
                  const wp = contact.workerProfile;
                  const skills = wp?.skills || [];
                  const primarySkill = wp?.primaryProfession || skills[0] || null;
                  const rating = wp?.averageRating;
                  const totalReviews = wp?.totalReviews;
                  const availabilityStatus = wp?.availabilityStatus || (isOnline ? 'Available' : 'Offline');
                  const availabilityClass = getWorkerAvailabilityClass(availabilityStatus);
                  const experience = wp?.experience;

                  if (isWorker) {
                    return (
                      <div
                        key={contact._id}
                        onClick={() => !startingChat && handleStartNewChat(contact)}
                        className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-white hover:bg-primary-50/40 hover:border-primary-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="relative shrink-0 mt-0.5">
                            <img
                              src={contact.avatar || fallbackAvatar}
                              onError={withImageFallback()}
                              alt={contact.name}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getPresenceDotClass(isOnline)} border-2 border-white rounded-full`}></div>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                                {contact.name}
                              </h4>
                              <RoleBadge role={contact.role} />
                              {availabilityStatus && (
                                <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${availabilityClass}`}>
                                  {availabilityStatus}
                                </span>
                              )}
                            </div>

                            {/* Profession, Rating & Experience */}
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                              {primarySkill ? (
                                <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100 flex items-center gap-1">
                                  <Briefcase size={11} className="text-primary-500" />
                                  <span>{t(`services.${primarySkill}`, { defaultValue: primarySkill })}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 font-medium">{t('home.verifiedPros', { defaultValue: 'Professional' })}</span>
                              )}

                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star size={12} fill="currentColor" />
                                {typeof rating === 'number' && rating > 0 ? (
                                  <span>
                                    {rating.toFixed(1)} {totalReviews > 0 && <span className="text-slate-400 font-medium">({totalReviews})</span>}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">{t('workerDashboard.noSkills', { defaultValue: 'New' })}</span>
                                )}
                              </div>

                              {typeof experience === 'number' && experience > 0 && (
                                <span className="text-slate-400 font-medium hidden sm:inline">
                                  · {experience} {t('auth.experience', { defaultValue: 'Years Exp.' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end shrink-0 sm:self-center">
                          <button
                            type="button"
                            disabled={startingChat}
                            className="px-4 py-2 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <MessageSquare size={14} />
                            <span>{t('common.chat', { defaultValue: 'Chat' })}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={contact._id}
                      onClick={() => !startingChat && handleStartNewChat(contact)}
                      className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-primary-50/40 hover:border-primary-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={contact.avatar || fallbackAvatar}
                            onError={withImageFallback()}
                            alt={contact.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getPresenceDotClass(isOnline)} border-2 border-white rounded-full`}></div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                              {contact.name}
                            </h4>
                            <RoleBadge role={contact.role} />
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {contact.email || contact.phone || ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={startingChat}
                        className="shrink-0 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <MessageSquare size={14} />
                        <span>{t('common.chat', { defaultValue: 'Chat' })}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Public Profile & Service History Modal */}
      <UserProfileModal
        userId={viewingUserProfileId}
        isOpen={Boolean(viewingUserProfileId)}
        onClose={() => setViewingUserProfileId(null)}
        onDiscussWorker={handleDiscussWorker}
      />
    </div>
  );
};

export default ChatPage;
