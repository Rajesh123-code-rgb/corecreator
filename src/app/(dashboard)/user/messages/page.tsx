"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import {
    MessageCircle,
    Search,
    Send,
    Loader2,
    ChevronLeft,
    User,
    MoreVertical,
    Paperclip,
    Check,
    CheckCheck
} from "lucide-react";

interface Participant {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
}

interface Conversation {
    _id: string;
    participants: Participant[];
    otherParticipant: Participant;
    type: string;
    subject?: string;
    lastMessage?: { content: string; senderId: string; sentAt: string };
    unreadCount: number;
    updatedAt: string;
}

interface Message {
    _id: string;
    senderId: { _id: string; name: string; avatar?: string };
    content: string;
    createdAt: string;
    readBy: { userId: string; readAt: string }[];
}

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [messagesLoading, setMessagesLoading] = React.useState(false);
    const [newMessage, setNewMessage] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [totalUnread, setTotalUnread] = React.useState(0);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Fetch conversations
    const fetchConversations = React.useCallback(async () => {
        try {
            const res = await fetch("/api/messages");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
                setTotalUnread(data.totalUnread || 0);

                // Check for userId param to auto-select/create conversation
                const userIdParam = searchParams.get("userId");
                if (userIdParam) {
                    const existingConv = data.conversations?.find((c: Conversation) =>
                        c.participants.some(p => p._id === userIdParam)
                    );

                    if (existingConv) {
                        setSelectedConversation(existingConv);
                        // Clear param to avoid re-triggering
                        router.replace(window.location.pathname, { scroll: false });
                    } else {
                        // Create new conversation
                        try {
                            const createRes = await fetch("/api/messages", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ recipientId: userIdParam }),
                            });

                            if (createRes.ok) {
                                const createData = await createRes.json();
                                const newConv = createData.conversation;
                                // Basic polyfill if populate is shallow
                                if (!newConv.otherParticipant) {
                                    newConv.otherParticipant = newConv.participants.find((p: any) => p._id === userIdParam) || { _id: userIdParam, name: "User" };
                                }
                                setConversations(prev => [newConv, ...prev]);
                                setSelectedConversation(newConv);
                                router.replace(window.location.pathname, { scroll: false });
                            }
                        } catch (err) {
                            console.error("Failed to create conversation:", err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setLoading(false);
        }
    }, [searchParams, router]);

    React.useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Fetch messages when conversation selected
    const fetchMessages = React.useCallback(async (conversationId: string) => {
        setMessagesLoading(true);
        try {
            const res = await fetch(`/api/messages/${conversationId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                // Reset unread count
                setConversations(prev => prev.map(c =>
                    c._id === conversationId ? { ...c, unreadCount: 0 } : c
                ));
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
        }
    }, [selectedConversation, fetchMessages]);

    // Scroll to bottom on new messages
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const messageContent = newMessage.trim();
        setNewMessage("");
        setSending(true);

        try {
            const res = await fetch(`/api/messages/${selectedConversation._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: messageContent }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.message]);
                // Update conversation in list
                setConversations(prev => prev.map(c =>
                    c._id === selectedConversation._id
                        ? { ...c, lastMessage: { content: messageContent, senderId: "", sentAt: new Date().toISOString() } }
                        : c
                ).sort((a, b) => new Date(b.lastMessage?.sentAt || 0).getTime() - new Date(a.lastMessage?.sentAt || 0).getTime()));
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        if (diff < 604800000) {
            return date.toLocaleDateString([], { weekday: "short" });
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const filteredConversations = conversations.filter(c =>
        c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                        {totalUnread > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                {totalUnread} unread
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No conversations yet</p>
                            <p className="text-sm text-gray-400 mt-1">Start a conversation with a seller</p>
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <button
                                key={conversation._id}
                                onClick={() => setSelectedConversation(conversation)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${selectedConversation?._id === conversation._id ? "bg-purple-50" : ""
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                    {conversation.otherParticipant?.avatar ? (
                                        <img src={conversation.otherParticipant.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        conversation.otherParticipant?.name?.charAt(0) || "?"
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`font-medium truncate ${conversation.unreadCount > 0 ? "text-gray-900" : "text-gray-700"}`}>
                                            {conversation.otherParticipant?.name || "Unknown"}
                                        </p>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {conversation.lastMessage?.sentAt && formatTime(conversation.lastMessage.sentAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className={`text-sm truncate ${conversation.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                                            {conversation.lastMessage?.content || "No messages yet"}
                                        </p>
                                        {conversation.unreadCount > 0 && (
                                            <span className="w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                                {conversation.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${selectedConversation ? "flex" : "hidden md:flex"}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                {selectedConversation.otherParticipant?.avatar ? (
                                    <img src={selectedConversation.otherParticipant.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    selectedConversation.otherParticipant?.name?.charAt(0) || "?"
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{selectedConversation.otherParticipant?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{selectedConversation.otherParticipant?.role}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-center">
                                    <div>
                                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No messages yet</p>
                                        <p className="text-sm text-gray-400">Start the conversation</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message, index) => {
                                    const isOwnMessage = message.senderId._id === selectedConversation.otherParticipant?._id ? false : true;
                                    return (
                                        <div
                                            key={message._id}
                                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[70%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                                                <div className={`px-4 py-2 rounded-2xl ${isOwnMessage
                                                    ? "bg-purple-600 text-white rounded-br-md"
                                                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                                                    }`}>
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                                <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                                                    {formatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-100">
                            <div className="flex items-end gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        rows={1}
                                    />
                                </div>
                                <Button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || sending}
                                    className="h-12 px-4"
                                >
                                    {sending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Select a conversation</p>
                            <p className="text-sm text-gray-400 mt-1">Choose from your existing conversations</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
