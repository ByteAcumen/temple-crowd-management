'use client';

// RAG Chat Hook - Connect to trained chatbot with semantic search
// Endpoint: POST http://localhost:8002/chat

import { useState, useCallback } from 'react';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8002';

// Chat message structure
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    sources?: string[]; // Referenced FAQ sources
}

// Request to ML Chat API
interface ChatRequest {
    query: string;
    context?: {
        temple_id?: string;
        current_crowd?: number;
        user_intent?: string;
    };
    history?: { role: string; content: string }[];
}

// Response from ML Chat API
interface ChatResponse {
    response: string;
    sources?: string[];
    confidence?: number;
    suggested_actions?: string[];
}

interface UseRAGChatReturn {
    messages: ChatMessage[];
    sendMessage: (content: string, context?: ChatRequest['context']) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearChat: () => void;
    suggestedQuestions: string[];
}

// Pre-defined FAQ responses for fallback
const FAQ_RESPONSES: Record<string, string> = {
    'booking': 'To book a temple visit, go to the Temples page, select your preferred temple, and click "Book Now". You can choose your date, time slot, and number of visitors.',
    'cancel': 'To cancel a booking, go to your Dashboard, find the booking you want to cancel, and click the cancel option. Cancellations are free up to 24 hours before your visit.',
    'qr': 'Your QR code E-Pass is generated automatically after booking. You can find it in your Dashboard or in the confirmation email. Show this at the temple entrance.',
    'crowd': 'Check the Live Status page for real-time crowd information. Green means low crowd, Orange means moderate, and Red means high crowd.',
    'timing': 'Temple visiting hours vary. Most temples are open from 6:00 AM to 9:00 PM. Check the specific temple details for exact timings.',
    'dress': 'Most temples require modest clothing. Avoid shorts, sleeveless tops, and revealing clothes. Some temples provide cloth wraps at the entrance.',
    'default': 'I\'m here to help with temple bookings, crowd information, and general queries. How can I assist you today?',
};

// Suggested questions
const DEFAULT_SUGGESTIONS = [
    'How do I book a temple visit?',
    'What is the current crowd at Tirumala?',
    'How do I cancel my booking?',
    'What should I wear to the temple?',
    'How does the QR code work?',
];

export function useRAGChat(): UseRAGChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '🙏 Welcome to Temple Smart Support! I can help you with bookings, crowd information, and temple guidelines. How can I assist you today?',
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

    // Generate unique ID
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get fallback response from keywords
    const getFallbackResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('book') || lowerQuery.includes('reserve')) return FAQ_RESPONSES.booking;
        if (lowerQuery.includes('cancel')) return FAQ_RESPONSES.cancel;
        if (lowerQuery.includes('qr') || lowerQuery.includes('pass') || lowerQuery.includes('ticket')) return FAQ_RESPONSES.qr;
        if (lowerQuery.includes('crowd') || lowerQuery.includes('busy')) return FAQ_RESPONSES.crowd;
        if (lowerQuery.includes('time') || lowerQuery.includes('hour') || lowerQuery.includes('open')) return FAQ_RESPONSES.timing;
        if (lowerQuery.includes('dress') || lowerQuery.includes('wear') || lowerQuery.includes('cloth')) return FAQ_RESPONSES.dress;
        return FAQ_RESPONSES.default;
    };

    // Send message to RAG chatbot
    const sendMessage = useCallback(async (content: string, context?: ChatRequest['context']) => {
        if (!content.trim()) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            // Prepare chat history
            const history = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Attempt to fetch from real API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch(`${ML_API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: content,
                    context,
                    history,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Chat API error: ${response.status}`);
            }

            const data: ChatResponse = await response.json();

            // Add assistant response
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: data.response || getFallbackResponse(content),
                timestamp: new Date(),
                sources: data.sources,
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Update suggestions based on response
            if (data.suggested_actions?.length) {
                setSuggestedQuestions(data.suggested_actions);
            }
        } catch (err: any) {
            console.warn('RAG Chat API unavailable, using fallback:', err.message);

            // Simulate typing delay for fallback feel
            await new Promise(resolve => setTimeout(resolve, 600));

            // Fallback response when ML service is unavailable
            const fallbackMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: getFallbackResponse(content),
                timestamp: new Date(),
                // sources: ['Local Knowledge Base'] // Optional: indicate local fallback
            };
            setMessages(prev => [...prev, fallbackMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    // Clear chat history
    const clearChat = useCallback(() => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: '🙏 Chat cleared. How can I help you?',
                timestamp: new Date(),
            },
        ]);
        setError(null);
        setSuggestedQuestions(DEFAULT_SUGGESTIONS);
    }, []);

    return {
        messages,
        sendMessage,
        isLoading,
        error,
        clearChat,
        suggestedQuestions,
    };
}

export default useRAGChat;
