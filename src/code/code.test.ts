import { describe, expect, it } from "bun:test";
import { OpCodes, make } from "./code";
describe("make", () => {
	it("should return a typed array with the opcode and the encoding of the operands ", () => {
		const tests: { op: OpCodes; operands: number[]; expected: number[] }[] = [
			{
				op: OpCodes.OpConstant,
				operands: [65534],
				expected: [OpCodes.OpConstant, 255, 254],
			},
		];
		for (const { op, operands, expected } of tests) {
			const instruction = make(op, ...operands);
			expect(instruction.length).toBe(expected.length);
			expected.forEach((_, i) => {
				expect(instruction[i]).toBe(expected[i]);
			});
		}
	});
});
