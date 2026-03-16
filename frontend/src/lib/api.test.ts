import { describe, expect, it, beforeEach } from 'vitest';
import { api } from './api';

describe('Frontend API integration with backend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should fail login with invalid credentials', async () => {
    const result = await api.login(`noone${Date.now()}@example.com`, 'invalid-pass');
    expect(result.success).toBe(false);
  });

  it('should create account, fetch profile, and list products', async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    const signup = await api.signup(email, password, 'Test User');
    expect(signup.success).toBe(true);

    const profile = await api.getProfile();
    expect(profile.email).toBe(email);

    const products = await api.getProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products).toBeDefined();
  }, 20000);
});