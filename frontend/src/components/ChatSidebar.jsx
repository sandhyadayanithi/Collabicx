import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase/config';
import { sendMessage, listenToMessages } from '../firebase/functions';

export default function ChatSidebar({ teamId = "team-alpha-bits-id", onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const currentUser = auth.currentUser;

    useEffect(() => {
        const unsubscribe = listenToMessages(teamId, (msgs) => {
            setMessages(msgs);
            scrollToBottom();
        });
        return () => unsubscribe();
    }, [teamId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser) return;
        try {
            await sendMessage(teamId, currentUser.uid, newMessage);
            setNewMessage("");
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <aside className="w-80 border-l border-emerald-500/20 dark:border-emerald-500/20 bg-white/60 dark:bg-black/70 backdrop-blur-2xl flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">chat_bubble</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Chat</h3>
                </div>
                <div className="flex gap-2">
                    {onClose && (
                        <button onClick={onClose} className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">close_fullscreen</span>
                        </button>
                    )}
                    <button className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Today</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.userId === currentUser?.uid;
                    return (
                        <div key={msg.id} className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && (
                                    <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                        {msg.userId.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {isMe ? 'You' : `User ${msg.userId.substring(0, 4)}`}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                            <div className={`p-3 rounded-xl max-w-[85%] break-words text-sm ${isMe
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none'
                                }`}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/0 dark:bg-black/0 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="relative">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="form-textarea w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-primary focus:border-primary text-sm min-h-[50px] max-h-[120px] py-3 pr-12 pl-4 custom-scrollbar resize-none dark:text-white dark:placeholder-slate-500"
                        placeholder="Type a message..."
                        rows={1}
                        style={{ height: 'auto', minHeight: '50px' }}
                    ></textarea>
                    <button
                        onClick={handleSendMessage}
                        className="absolute bottom-2.5 right-2 size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                    {/* Optional Attach Button if needed later
                    <div className="absolute bottom-2 left-2 flex gap-2">...</div>
                    */}
                </div>
            </div>
        </aside>
    );
}
