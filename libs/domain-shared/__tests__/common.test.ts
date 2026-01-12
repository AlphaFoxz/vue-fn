import { describe, expect, it } from 'vitest';
import { Utils } from '..';

describe('domain-shared/common', () => {
  describe('genId', () => {
    it('should return the input name', () => {
      const result = Utils.genId('test-name');
      expect(result).toBe('test-name');
    });

    it('should handle empty string', () => {
      const result = Utils.genId('');
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const result = Utils.genId('test-id-123');
      expect(result).toBe('test-id-123');
    });

    it('should handle unicode characters', () => {
      const result = Utils.genId('test-测试-id');
      expect(result).toBe('test-测试-id');
    });
  });
});
