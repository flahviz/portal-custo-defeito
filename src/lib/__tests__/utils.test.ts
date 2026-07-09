import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('handles conditional classes', () => {
      const condition1 = true;
      const condition2 = false;
      expect(cn('base-class', condition1 && 'conditional-class')).toBe(
        'base-class conditional-class'
      );
      expect(cn('base-class', condition2 && 'conditional-class')).toBe('base-class');
    });

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('handles objects with boolean values', () => {
      expect(
        cn({
          class1: true,
          class2: false,
          class3: true,
        })
      ).toBe('class1 class3');
    });

    it('handles undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });

    it('merges conflicting Tailwind classes correctly', () => {
      // twMerge should handle conflicting classes by keeping the last one
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
    });
  });
});
