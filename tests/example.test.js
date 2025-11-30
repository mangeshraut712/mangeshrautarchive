import { describe, it, expect } from 'vitest';

describe('Basic Sanity Check', () => {
    it('should pass this basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have correct environment', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});
