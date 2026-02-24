/**
 * Auth Middleware Unit Tests
 * Tests protect() and authorize() without a live DB connection (mock-based)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { protect, authorize } = require('../../src/middleware/auth');

// Helper to build mock Express req/res/next
function buildMocks({ authHeader = null, user = null } = {}) {
    const req = { headers: {}, user: null };
    if (authHeader) req.headers.authorization = authHeader;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    const next = jest.fn();
    return { req, res, next };
}

// ── protect() ─────────────────────────────────────────────────────────────────
describe('protect middleware', () => {
    afterEach(() => jest.clearAllMocks());

    test('returns 401 when no token is provided', async () => {
        const { req, res, next } = buildMocks();
        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when token is invalid', async () => {
        jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
        const { req, res, next } = buildMocks({ authHeader: 'Bearer bad.token' });

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when user does not exist in DB', async () => {
        jwt.verify.mockReturnValue({ id: 'nonexistent-id' });
        User.findById.mockResolvedValue(null);

        const { req, res, next } = buildMocks({ authHeader: 'Bearer valid.token' });
        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next() and sets req.user when token is valid', async () => {
        const mockUser = { _id: 'user123', role: 'user', name: 'Test User' };
        jwt.verify.mockReturnValue({ id: 'user123' });
        User.findById.mockResolvedValue(mockUser);

        const { req, res, next } = buildMocks({ authHeader: 'Bearer valid.token' });
        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(mockUser);
    });
});

// ── authorize() ───────────────────────────────────────────────────────────────
describe('authorize middleware', () => {
    test('calls next() when user role is allowed', () => {
        const { req, res, next } = buildMocks();
        req.user = { role: 'admin' };

        authorize('admin', 'gatekeeper')(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('returns 403 when user role is not in allowed list', () => {
        const { req, res, next } = buildMocks();
        req.user = { role: 'user' };

        authorize('admin', 'gatekeeper')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when role is undefined', () => {
        const { req, res, next } = buildMocks();
        req.user = {};

        authorize('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('gatekeeper can access gatekeeper-only routes', () => {
        const { req, res, next } = buildMocks();
        req.user = { role: 'gatekeeper' };

        authorize('gatekeeper')(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
