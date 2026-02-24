/**
 * Bot Controller Unit Tests
 * Tests chat() handler with mocked DB and services
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../../src/models/Temple', () => ({
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
}));

jest.mock('../../src/models/Booking', () => ({
    countDocuments: jest.fn().mockResolvedValue(0)
}));

jest.mock('../../src/services/CrowdTracker', () => ({
    getCurrentCount: jest.fn(),
    init: jest.fn()
}));

jest.mock('../../src/services/BotMemory', () => ({
    addMessage: jest.fn(),
    getHistoryContext: jest.fn().mockReturnValue(''),
    getSession: jest.fn().mockReturnValue({ history: [] })
}));

jest.mock('../../src/config/redis', () => ({
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    connect: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG')
}));

jest.mock('axios');

const Temple = require('../../src/models/Temple');
const crowdTracker = require('../../src/services/CrowdTracker');
const BotMemory = require('../../src/services/BotMemory');
const axios = require('axios');
const botController = require('../../src/controllers/botController');

describe('Smart Agent Controller', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
        // Default: BotMemory.getSession always returns a valid session
        BotMemory.getSession.mockReturnValue({ history: [] });
    });

    // ── Validation ─────────────────────────────────────────────────────────────
    it('should return 400 if query is missing', async () => {
        await botController.chat(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        // Controller sends { success: false, error: 'Query required' }
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
    });

    it('should return 400 if query is whitespace only', async () => {
        req.body.query = '   ';
        await botController.chat(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ── Local KB fallback ──────────────────────────────────────────────────────
    test('responds to greeting queries from local KB', async () => {
        req.body.query = 'Hello';
        // No DB hits expected — localKB handles greetings
        Temple.find.mockResolvedValue([]);

        await botController.chat(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                source: 'local_kb'
            })
        );
    });

    test('responds to booking queries from local KB', async () => {
        req.body.query = 'How do I book a visit?';
        Temple.find.mockResolvedValue([]);

        await botController.chat(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                source: 'local_kb',
                answer: expect.stringContaining('Book')
            })
        );
    });

    // ── Session ID ─────────────────────────────────────────────────────────────
    test('preserves sessionId from request body', async () => {
        req.body.query = 'Hello';
        req.body.sessionId = 'my-unique-session-id';
        Temple.find.mockResolvedValue([]);

        await botController.chat(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                sessionId: 'my-unique-session-id'
            })
        );
    });

    test('generates a sessionId when none provided', async () => {
        req.body.query = 'Hello';
        Temple.find.mockResolvedValue([]);

        await botController.chat(req, res);

        const call = res.json.mock.calls[0][0];
        expect(call.sessionId).toBeDefined();
        expect(typeof call.sessionId).toBe('string');
        expect(call.sessionId.length).toBeGreaterThan(0);
    });

    // ── Response shape ─────────────────────────────────────────────────────────
    test('response always includes success, sessionId, answer, source, suggestedQuestions', async () => {
        req.body.query = 'What is the dress code?';
        Temple.find.mockResolvedValue([]);

        await botController.chat(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                sessionId: expect.any(String),
                answer: expect.any(String),
                source: expect.any(String),
                suggestedQuestions: expect.any(Array)
            })
        );
    });
});
