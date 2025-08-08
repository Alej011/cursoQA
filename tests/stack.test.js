import {expect, test} from "vitest";
import {stack} from "../src/stack.ts";

test ('it should return the last element of the stack', () => {
    const str = '(';
    const result = stack(stackArray);
    
    expect(result).toBe(5);
} );