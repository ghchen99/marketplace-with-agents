'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ... other imports

import { useRouter } from 'next/navigation';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    type?: 'token' | 'tool_start' | 'tool_end' | 'tool_output';
    toolName?: string;
    toolInput?: string;
    toolOutput?: string;
}

export default function Chatbot() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState(() => generateThreadId());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function generateThreadId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const handleReset = () => {
        setMessages([]);
        setThreadId(generateThreadId());
        setInput('');
    };

    const streamChat = async (userMessage: string) => {
        const payload = {
            messages: [{ role: 'user', content: userMessage }],
            thread_id: threadId,
            resume_value: null,
        };

        try {
            const response = await fetch('http://127.0.0.1:8001/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No reader available');
            }

            let assistantMessage = '';
            let currentToolMessages: Message[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') {
                            // Stream is complete, messages have already been added in real-time
                            return;
                        }

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.type === 'token') {
                                assistantMessage += data.content;
                                // Update the last message in real-time
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];

                                    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.type === 'token') {
                                        newMessages[newMessages.length - 1] = {
                                            ...lastMessage,
                                            content: assistantMessage,
                                        };
                                    } else {
                                        newMessages.push({
                                            role: 'assistant',
                                            content: assistantMessage,
                                            type: 'token',
                                        });
                                    }

                                    return newMessages;
                                });
                            } else if (data.type === 'tool_start') {
                                // Reset assistant message when a tool starts
                                assistantMessage = '';

                                const toolStartMessage: Message = {
                                    role: 'assistant',
                                    content: `Using tool: ${data.name}`,
                                    type: 'tool_start',
                                    toolName: data.name,
                                    toolInput: JSON.stringify(data.input),
                                };
                                currentToolMessages.push(toolStartMessage);
                                setMessages((prev) => [...prev, toolStartMessage]);
                            } else if (data.type === 'tool_end') {
                                const output = data.output || '';
                                const preview = typeof output === 'string'
                                    ? (output.length > 150 ? output.slice(0, 150) + '...' : output)
                                    : JSON.stringify(output).slice(0, 150);

                                const toolEndMessage: Message = {
                                    role: 'assistant',
                                    content: `Tool completed: ${data.name}`,
                                    type: 'tool_end',
                                    toolName: data.name,
                                    toolOutput: preview,
                                };

                                // Dispatch event if cart was modified by the agent
                                if (data.name === 'add_to_cart' || data.name === 'checkout') {
                                    window.dispatchEvent(new Event('cart-updated'));
                                }

                                currentToolMessages.push(toolEndMessage);
                                setMessages((prev) => [...prev, toolEndMessage]);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error streaming chat:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please make sure the shopping agent is running on http://127.0.0.1:8001',
                    type: 'token',
                },
            ]);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        await streamChat(userMessage);
        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderMessage = (message: Message, index: number) => {
        if (message.role === 'user') {
            return (
                <div key={index} className="flex justify-end mb-4">
                    <div className="bg-[#232f3e] text-white px-4 py-2 rounded-lg max-w-[80%] shadow-md">
                        {message.content}
                    </div>
                </div>
            );
        }

        // Assistant messages with different types
        if (message.type === 'token') {
            return (
                <div key={index} className="flex justify-start mb-4">
                    <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg max-w-[80%] shadow-md prose prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // Style unordered lists
                                ul: ({ node, ...props }) => (
                                    <ul className="list-disc list-inside my-2 space-y-1" {...props} />
                                ),
                                // Style ordered lists
                                ol: ({ node, ...props }) => (
                                    <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
                                ),
                                // Style list items
                                li: ({ node, ...props }) => (
                                    <li className="ml-2" {...props} />
                                ),
                                // Style bold text
                                strong: ({ node, ...props }) => (
                                    <strong className="font-bold text-gray-900" {...props} />
                                ),
                                // Style italic text
                                em: ({ node, ...props }) => (
                                    <em className="italic" {...props} />
                                ),
                                // Style code blocks
                                code: ({ node, inline, ...props }: any) =>
                                    inline ? (
                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                                    ) : (
                                        <code className="block bg-gray-100 p-2 rounded my-2 text-sm font-mono overflow-x-auto" {...props} />
                                    ),
                                // Style paragraphs
                                p: ({ node, ...props }) => (
                                    <p className="my-1" {...props} />
                                ),
                                // Style links
                                a: ({ node, href, ...props }) => {
                                    const handleClick = (e: React.MouseEvent) => {
                                        if (href && (href.startsWith('/') || href.includes(window.location.origin))) {
                                            e.preventDefault();
                                            // Handle relative or same-origin URLs via router
                                            const url = href.startsWith('/') ? href : new URL(href).pathname;
                                            router.push(url);
                                        }
                                    };

                                    return (
                                        <a
                                            href={href}
                                            onClick={handleClick}
                                            className="text-[#007185] hover:text-[#C7511F] underline cursor-pointer"
                                            {...props}
                                        />
                                    );
                                },
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>
            );
        }

        if (message.type === 'tool_start') {
            return (
                <div key={index} className="flex justify-start mb-3">
                    <div className="bg-gray-100 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg max-w-[80%] text-sm shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Tool: {message.toolName}</span>
                        </div>
                        {message.toolInput && (
                            <div className="mt-1 text-xs text-gray-500 font-mono">
                                Input: {message.toolInput}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (message.type === 'tool_end') {
            return (
                <div key={index} className="flex justify-start mb-3">
                    <div className="bg-gray-100 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg max-w-[80%] text-sm shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">Completed: {message.toolName}</span>
                        </div>
                        {message.toolOutput && (
                            <div className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                                {message.toolOutput}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-[#232f3e] hover:bg-[#131921] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 group"
                    aria-label="Open chat"
                >
                    <MessageCircle className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFD814] rounded-full animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[500px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#232f3e] text-white p-4 flex justify-between items-center rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <h3 className="font-semibold">Shopping Assistant</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleReset}
                                className="hover:bg-[#131921] p-2 rounded-lg transition-colors"
                                aria-label="Reset conversation"
                                title="Start new conversation"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-[#131921] p-2 rounded-lg transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 bg-gray-50"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-8">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">Hi! I'm your shopping assistant.</p>
                                <p className="text-xs mt-2">Ask me to help you find products, add items to your cart, or checkout!</p>
                            </div>
                        )}
                        {messages.map((message, index) => renderMessage(message, index))}
                        {isLoading && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-md">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD814] focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-[#FFD814] hover:bg-[#FFA41C] text-[#0F1111] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                aria-label="Send message"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            Thread ID: {threadId.slice(0, 8)}...
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
