const botController = require('../../src/controllers/botController');

// Mock dependencies with explicit factories to prevent side effects
jest.mock('../../src/models/Temple', () => ({
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
}));

jest.mock('../../src/services/CrowdTracker', () => ({
    getCurrentCount: jest.fn(),
    init: jest.fn()
}));

jest.mock('../../src/services/BotMemory', () => ({
    addMessage: jest.fn(),
    getHistoryContext: jest.fn().mockReturnValue(""),
    getSession: jest.fn()
}));

jest.mock('../../src/config/redis', () => ({
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    connect: jest.fn()
}));

jest.mock('axios');

const Temple = require('../../src/models/Temple');
const crowdTracker = require('../../src/services/CrowdTracker');
const BotMemory = require('../../src/services/BotMemory');
const axios = require('axios');

describe('Smart Agent Controller', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should return 400 if query is missing', async () => {
        await botController.chat(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Query is required' });
    });

    test('Tool Execution: Close Temple', async () => {
        req.body.query = "Close Somnath temple please";

        Temple.findOneAndUpdate.mockResolvedValue({
            name: 'Somnath',
            status: 'CLOSED'
        });

        await botController.chat(req, res);

        expect(Temple.findOneAndUpdate).toHaveBeenCalledWith(
            { name: { $regex: 'somnath', $options: 'i' } },
            { status: 'CLOSED' },
            { new: true }
        );

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            answer: expect.stringContaining('Somnath is now CLOSED')
        }));
    });

    test('Tool Execution: Get Status', async () => {
        req.body.query = "What is the status of Somnath?";

        Temple.findOne.mockResolvedValue({
            _id: '123',
            name: 'Somnath',
            status: 'OPEN',
            capacity: { total: 5000 }
        });

        crowdTracker.getCurrentCount.mockResolvedValue(150);

        await botController.chat(req, res);

        expect(Temple.findOne).toHaveBeenCalled();
        expect(crowdTracker.getCurrentCount).toHaveBeenCalledWith('123');

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            answer: expect.stringContaining('150 visitors')
        }));
    });

    test('Fallback to RAG (Axios)', async () => {
        req.body.query = "Who built this temple?";

        // Mock Live Stats call inside controller
        Temple.find.mockResolvedValue([]);

        axios.post.mockResolvedValue({
            data: { answer: 'It was built by ancient architects.' }
        });

        await botController.chat(req, res);

        expect(axios.post).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            source: 'ai_rag',
            answer: 'It was built by ancient architects.'
        }));
    });

    test('Session ID Maintenance', async () => {
        req.body.query = "Hello";
        req.body.sessionId = "my-unique-session-id";

        await botController.chat(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sessionId: "my-unique-session-id"
        }));
    });
});
