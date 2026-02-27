import { generateToken, verifyToken, hashPassword, comparePassword } from '../src/utils/auth';

describe('auth utils', () => {
  it('generates and verifies a JWT token with the same payload', () => {
    const payload = {
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'Admin',
    };

    const token = generateToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.organizationId).toBe(payload.organizationId);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws on invalid token', () => {
    expect(() => verifyToken('invalid.token.value')).toThrow('Invalid or expired token');
  });

  it('hashes and compares passwords correctly', async () => {
    const password = 'StrongPassword123!';

    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);

    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);

    const isMismatch = await comparePassword('wrong-password', hashed);
    expect(isMismatch).toBe(false);
  });
});

