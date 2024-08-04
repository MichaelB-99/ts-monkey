import { describe, expect, it } from "bun:test";
import { OpCodes, lookupOpCode, make, readOperands } from "./code";
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
it("should decode operands", () => {
	const tests = [
		{
			op: OpCodes.OpConstant,
			operands: [65534],
			bytesRead: 2,
		},
	];
	for (const { op, operands, bytesRead } of tests) {
		const instruction = make(op, ...operands);
		const def = lookupOpCode(op);

		expect(def).not.toBeFalsy();

		const [decodedOps, numBytesRead] = readOperands(def, instruction.slice(1));
		expect(decodedOps).toEqual(operands);
		expect(numBytesRead).toBe(bytesRead);
	}
});
