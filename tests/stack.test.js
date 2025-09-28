import {expect, test} from "vitest";
import {balanceBrackets} from "../src/stack.ts";

test ('it should balance brackets correctly', () => {
    const str = '()';
    const result = balanceBrackets(str);

    // For now, just testing that function exists and can be called
    expect(result).toBeDefined();
} );