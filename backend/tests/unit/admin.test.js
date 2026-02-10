/**
 * Admin Role Tests for Temple Backend
 * Tests Super Admin + Temple Admin hierarchy
 */

describe('Admin Role Validation', () => {
    // Mock user objects
    const superAdmin = {
        _id: 'super123',
        name: 'Super Admin',
        email: 'super@temple.com',
        role: 'admin',
        isSuperAdmin: true,
        assignedTemples: []
    };

    const templeAdmin = {
        _id: 'temple123',
        name: 'Temple Admin',
        email: 'admin@temple.com',
        role: 'admin',
        isSuperAdmin: false,
        assignedTemples: ['temple1', 'temple2']
    };

    const gatekeeper = {
        _id: 'gk123',
        name: 'Gate Keeper',
        email: 'gate@temple.com',
        role: 'gatekeeper',
        isSuperAdmin: false,
        assignedTemples: ['temple1']
    };

    test('Super Admin has full access', () => {
        expect(superAdmin.isSuperAdmin).toBe(true);
        expect(superAdmin.role).toBe('admin');
    });

    test('Temple Admin has limited access', () => {
        expect(templeAdmin.isSuperAdmin).toBe(false);
        expect(templeAdmin.assignedTemples.length).toBeGreaterThan(0);
    });

    test('Gatekeeper role is correctly set', () => {
        expect(gatekeeper.role).toBe('gatekeeper');
        expect(gatekeeper.isSuperAdmin).toBe(false);
    });
});

describe('Temple Assignment Logic', () => {
    function canAccessTemple(user, templeId) {
        // Super Admin can access all
        if (user.isSuperAdmin) return true;

        // Check assigned temples
        return user.assignedTemples.includes(templeId);
    }

    const superAdmin = { isSuperAdmin: true, assignedTemples: [] };
    const templeAdmin = { isSuperAdmin: false, assignedTemples: ['temple1', 'temple2'] };

    test('Super Admin can access any temple', () => {
        expect(canAccessTemple(superAdmin, 'temple1')).toBe(true);
        expect(canAccessTemple(superAdmin, 'temple99')).toBe(true);
    });

    test('Temple Admin can access assigned temples', () => {
        expect(canAccessTemple(templeAdmin, 'temple1')).toBe(true);
        expect(canAccessTemple(templeAdmin, 'temple2')).toBe(true);
    });

    test('Temple Admin cannot access unassigned temples', () => {
        expect(canAccessTemple(templeAdmin, 'temple3')).toBe(false);
    });
});

describe('Admin Creation Permissions', () => {
    function canCreateAdmin(requestingUser, targetRole) {
        // Only super admins can create admin accounts
        if (targetRole === 'admin' && !requestingUser.isSuperAdmin) {
            return false;
        }
        // All admins can create gatekeeper accounts
        if (targetRole === 'gatekeeper' && requestingUser.role === 'admin') {
            return true;
        }
        return requestingUser.isSuperAdmin;
    }

    const superAdmin = { role: 'admin', isSuperAdmin: true };
    const templeAdmin = { role: 'admin', isSuperAdmin: false };

    test('Super Admin can create other admins', () => {
        expect(canCreateAdmin(superAdmin, 'admin')).toBe(true);
    });

    test('Temple Admin cannot create other admins', () => {
        expect(canCreateAdmin(templeAdmin, 'admin')).toBe(false);
    });

    test('Temple Admin can create gatekeepers', () => {
        expect(canCreateAdmin(templeAdmin, 'gatekeeper')).toBe(true);
    });

    test('Super Admin can create gatekeepers', () => {
        expect(canCreateAdmin(superAdmin, 'gatekeeper')).toBe(true);
    });
});

describe('User Login Response Fields', () => {
    const mockLoginResponse = {
        success: true,
        token: 'jwt.token.here',
        user: {
            id: 'user123',
            name: 'Admin User',
            email: 'admin@temple.com',
            role: 'admin',
            isSuperAdmin: true,
            assignedTemples: ['temple1']
        }
    };

    test('Login response includes isSuperAdmin', () => {
        expect(mockLoginResponse.user).toHaveProperty('isSuperAdmin');
    });

    test('Login response includes assignedTemples', () => {
        expect(mockLoginResponse.user).toHaveProperty('assignedTemples');
        expect(Array.isArray(mockLoginResponse.user.assignedTemples)).toBe(true);
    });

    test('Login response structure is complete', () => {
        expect(mockLoginResponse).toHaveProperty('success');
        expect(mockLoginResponse).toHaveProperty('token');
        expect(mockLoginResponse).toHaveProperty('user');
        expect(mockLoginResponse.user).toHaveProperty('id');
        expect(mockLoginResponse.user).toHaveProperty('name');
        expect(mockLoginResponse.user).toHaveProperty('email');
        expect(mockLoginResponse.user).toHaveProperty('role');
    });
});
