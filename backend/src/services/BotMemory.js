/**
 * BotMemory Service
 * Manages conversation history for the Smart Agent.
 * Currently uses in-memory Map (volatile).
 * Future Upgrade: Redis.
 */
class BotMemory {
    constructor() {
        this.sessions = new Map();
        this.MAX_HISTORY = 10; // Keep last 10 turns
        this.EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Get or create a session
     * @param {string} sessionId 
     */
    getSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                history: [],
                lastActive: Date.now()
            });
        }
        return this.sessions.get(sessionId);
    }

    /**
     * Add a message to history
     * @param {string} sessionId 
     * @param {string} role - 'user' or 'assistant'
     * @param {string} text 
     */
    addMessage(sessionId, role, text) {
        const session = this.getSession(sessionId);
        session.history.push({ role, text, timestamp: Date.now() });
        session.lastActive = Date.now();

        // Trim history
        if (session.history.length > this.MAX_HISTORY) {
            session.history = session.history.slice(session.history.length - this.MAX_HISTORY);
        }
    }

    /**
     * Get formatted history for Context
     * @param {string} sessionId 
     * @returns {string} Text block of conversation
     */
    getHistoryContext(sessionId) {
        const session = this.getSession(sessionId);
        return session.history
            .map(msg => `${msg.role.toUpperCase()}: ${msg.text}`)
            .join('\n');
    }

    /**
     * Clear session
     */
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}

module.exports = new BotMemory();
