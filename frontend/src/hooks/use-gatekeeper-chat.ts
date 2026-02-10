'use client';

// Gatekeeper Chat Hook - Specialized for Security Staff
// Fallback-first approach for reliability

import { useState, useCallback } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

const GK_FAQ_RESPONSES: Record<string, string> = {
    'scan': 'Ensure the QR code is within the frame and well-lit. If camera fails, switch to "Manual" mode and type the Pass ID.',
    'manual': 'Switch to Manual mode using the toggle below the scanner. Enter the Pass ID (e.g., PAS-12345) and tap Verify.',
    'invalid': 'If a pass says "Invalid", do NOT allow entry. Ask the visitor to check their booking date or temple location.',
    'red': 'A RED screen means access is DENIED. Check the error message (Expired, Used, etc.).',
    'green': 'A GREEN screen means access is APPROVED. Verify the visitor count matches the screen.',
    'sync': 'The app syncs automatically. If you suspect lag, pull down to refresh or check your internet connection.',
    'emergency': 'For medical emergencies, call Ambulance (108). For security threats, call Police (100). Buttons are in the Support menu.',
    'logout': 'Tap the Logout button in the bottom navigation bar to end your shift.',
    'default': 'I can help with scanning issues, app errors, or emergency procedures. What do you need?',
};

const GK_SUGGESTIONS = [
    'Scanner not working',
    'Pass shows Invalid',
    'How to use Manual mode?',
    'Emergency Contacts',
    'Screen is Red',
];

export function useGatekeeperChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '🛡️ Gatekeeper Support. I can help with scanning, validation rules, or emergencies.',
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const getResponse = (query: string): string => {
        const lower = query.toLowerCase();
        if (lower.includes('scan') || lower.includes('camera') || lower.includes('qr')) return GK_FAQ_RESPONSES.scan;
        if (lower.includes('manual') || lower.includes('type') || lower.includes('keyboard')) return GK_FAQ_RESPONSES.manual;
        if (lower.includes('invalid') || lower.includes('fail') || lower.includes('reject')) return GK_FAQ_RESPONSES.invalid;
        if (lower.includes('red') || lower.includes('deny') || lower.includes('stop')) return GK_FAQ_RESPONSES.red;
        if (lower.includes('green') || lower.includes('allow') || lower.includes('ok')) return GK_FAQ_RESPONSES.green;
        if (lower.includes('sync') || lower.includes('net') || lower.includes('slow')) return GK_FAQ_RESPONSES.sync;
        if (lower.includes('emergency') || lower.includes('police') || lower.includes('doctor') || lower.includes('help')) return GK_FAQ_RESPONSES.emergency;
        if (lower.includes('logout') || lower.includes('exit') || lower.includes('close')) return GK_FAQ_RESPONSES.logout;
        return GK_FAQ_RESPONSES.default;
    };

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMsg: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Simulate network delay for natural feel
        setTimeout(() => {
            const assistantMsg: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: getResponse(content),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            setIsLoading(false);
        }, 600);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '🛡️ Chat cleared. Ready to assist.',
            timestamp: new Date(),
        }]);
    }, []);

    return {
        messages,
        sendMessage,
        isLoading,
        clearChat,
        suggestions: GK_SUGGESTIONS
    };
}
