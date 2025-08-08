import {expect, test} from 'vitest';
import {sumar} from '../src/index.ts';

test('adds 1 + 2 to equal 3', () => {
   const a = 1;
   const b = 2;

    const result = sumar(a, b);

    expect(result).toBe(3);
}); 