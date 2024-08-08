import { describe, expect, it } from "bun:test";
import { type Instructions, OpCodes, make, stringify } from "../code/code";
import { Lexer } from "../lexer/lexer";
import { IntegerObject, type InternalObject } from "../object/object";
import { Parser } from "../parser/parser";
import { flattenTypedArrays } from "../utils/flatten-typed-arrays";
import type { Maybe } from "../utils/types";
import { Compiler } from "./compiler";
describe("compiler", () => {
	it("should compile integer arithmetic", () => {
		const tests = [
			{
				input: "1",
				expectedConstants: [1],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1+2",
				expectedConstants: [1, 2],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpAdd),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1-2",
				expectedConstants: [1, 2],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpSub),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1+2+3",
				expectedConstants: [1, 2, 3],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpAdd),
					make(OpCodes.OpConstant, 2),
					make(OpCodes.OpAdd),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1;2;",
				expectedConstants: [1, 2],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpPop),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpPop),
				],
			},
		];
		runCompilerTests(tests);
	});
});
const lexAndParse = (input: string) =>
	new Parser(new Lexer(input)).parseProgram();

const runCompilerTests = (
	tests: {
		input: string;
		expectedConstants: number[];
		expectedInstructions: Uint8Array[];
	}[],
) => {
	for (const { input, expectedConstants, expectedInstructions } of tests) {
		const program = lexAndParse(input);
		const compiler = new Compiler();
		compiler.compile(program);
		const bytecode = compiler.bytecode();
		testInstructions(bytecode.instructions, expectedInstructions);
		testConstants(bytecode.constants, expectedConstants);
	}
};

const testInstructions = (actual: Instructions, expected: Uint8Array[]) => {
	const flattened = flattenTypedArrays(expected);
	expect(stringify(actual)).toEqual(stringify(new Uint8Array(flattened)));
};

// biome-ignore lint/suspicious/noExplicitAny:
const testConstants = (actual: Maybe<InternalObject>[], expected: any[]) => {
	expect(actual.length).toBe(expected.length);
	expected.forEach((expConstant, i) => {
		switch (typeof expConstant) {
			case "number":
				testIntegerObject(actual[i]!, expConstant);
				break;

			default:
				break;
		}
	});
};

const testIntegerObject = (obj: InternalObject, expected: number) => {
	expect(obj).toBeInstanceOf(IntegerObject);
	expect((obj as IntegerObject).value).toBe(expected);
};
