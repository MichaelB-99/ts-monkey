import { describe, expect, it } from "bun:test";
import { type Instructions, OpCodes, make, stringify } from "../code/code";
import { Lexer } from "../lexer/lexer";
import {
	IntegerObject,
	type InternalObject,
	StringObject,
} from "../object/object";
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
			{
				input: "-1",
				expectedConstants: [1],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpMinus),
					make(OpCodes.OpPop),
				],
			},
		];
		runCompilerTests(tests);
	});
	it("should compile boolean expressions", () => {
		const tests: {
			input: string;
			expectedConstants: number[];
			expectedInstructions: Uint8Array[];
		}[] = [
			{
				input: "true",
				expectedConstants: [],
				expectedInstructions: [make(OpCodes.OpTrue), make(OpCodes.OpPop)],
			},
			{
				input: "false",
				expectedConstants: [],
				expectedInstructions: [make(OpCodes.OpFalse), make(OpCodes.OpPop)],
			},
			{
				input: "5>2",
				expectedConstants: [5, 2],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpGreaterThan),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1<2",
				expectedConstants: [2, 1],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpGreaterThan),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1>=1",
				expectedConstants: [1, 1],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpGreaterThanOrEqual),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "5<=10",
				expectedConstants: [10, 5],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpGreaterThanOrEqual),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "true!=false",
				expectedConstants: [],
				expectedInstructions: [
					make(OpCodes.OpTrue, 0),
					make(OpCodes.OpFalse, 1),
					make(OpCodes.OpNotEqual),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "1==1",
				expectedConstants: [1, 1],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpEqual),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "2!=1",
				expectedConstants: [2, 1],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpNotEqual),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "!true",
				expectedConstants: [],
				expectedInstructions: [
					make(OpCodes.OpTrue),
					make(OpCodes.OpBang),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "!!true",
				expectedConstants: [],
				expectedInstructions: [
					make(OpCodes.OpTrue),
					make(OpCodes.OpBang),
					make(OpCodes.OpBang),
					make(OpCodes.OpPop),
				],
			},
		];
		runCompilerTests(tests);
	});
	it("should compile if expressions", () => {
		runCompilerTests([
			{
				input: "if(true){10}; 50;",
				expectedConstants: [10, 50],
				expectedInstructions: [
					// #0000
					make(OpCodes.OpTrue),
					// #0001
					make(OpCodes.OpJumpNotTruthy, 10),
					// #0004
					make(OpCodes.OpConstant, 0),
					// #0007
					make(OpCodes.OpJump, 11),
					// #0010
					make(OpCodes.OpNull),
					// #0011
					make(OpCodes.OpPop),
					// #0012
					make(OpCodes.OpConstant, 1),
					// #0015
					make(OpCodes.OpPop),
				],
			},
			{
				input: "if (true) { 10 } else { 20 }; 3333;",
				expectedConstants: [10, 20, 3333],
				expectedInstructions: [
					// #000
					make(OpCodes.OpTrue),
					// #001
					make(OpCodes.OpJumpNotTruthy, 10),
					// #004
					make(OpCodes.OpConstant, 0),
					// #007
					make(OpCodes.OpJump, 13),
					// #010
					make(OpCodes.OpConstant, 1),
					// #013
					make(OpCodes.OpPop),
					// #014
					make(OpCodes.OpConstant, 2),
					// #017
					make(OpCodes.OpPop),
				],
			},
			{
				input: "if(5+5){10}; 50;",
				expectedConstants: [5, 5, 10, 50],
				expectedInstructions: [
					// #0000
					make(OpCodes.OpConstant, 0),
					// #0003
					make(OpCodes.OpConstant, 1),
					// #0006
					make(OpCodes.OpAdd),
					// #0007
					make(OpCodes.OpJumpNotTruthy, 16),
					// #0010
					make(OpCodes.OpConstant, 2),
					// #0013
					make(OpCodes.OpJump, 17),
					// #0016
					make(OpCodes.OpNull),
					// #0017
					make(OpCodes.OpPop),
					// #0018
					make(OpCodes.OpConstant, 3),
					// #0021
					make(OpCodes.OpPop),
				],
			},
			{
				input: "if(true){200}",
				expectedConstants: [200],
				expectedInstructions: [
					// #0000
					make(OpCodes.OpTrue),
					// #0001
					make(OpCodes.OpJumpNotTruthy, 10),
					// #0004
					make(OpCodes.OpConstant, 0),
					// #0007
					make(OpCodes.OpJump, 11),
					// #0010
					make(OpCodes.OpNull),
					// #0011
					make(OpCodes.OpPop),
				],
			},
			{
				input: "if(false){200} else {100}",
				expectedConstants: [200, 100],
				expectedInstructions: [
					// #0000
					make(OpCodes.OpFalse),
					// #0001
					make(OpCodes.OpJumpNotTruthy, 10),
					// #0004
					make(OpCodes.OpConstant, 0),
					// #0007
					make(OpCodes.OpJump, 13),
					// #0010
					make(OpCodes.OpConstant, 1),
					// #0013
					make(OpCodes.OpPop),
				],
			},
		]);
	});
	describe("let statements", () => {
		it("should compile", () => {
			runCompilerTests([
				{
					input: "let one =1;let two = 2;",
					expectedConstants: [1, 2],
					expectedInstructions: [
						make(OpCodes.OpConstant, 0),
						make(OpCodes.OpSetGlobal, 0),
						make(OpCodes.OpConstant, 1),
						make(OpCodes.OpSetGlobal, 1),
					],
				},
				{
					input: "let one =1; one;",
					expectedConstants: [1],
					expectedInstructions: [
						make(OpCodes.OpConstant, 0),
						make(OpCodes.OpSetGlobal, 0),
						make(OpCodes.OpGetGlobal, 0),
						make(OpCodes.OpPop, 0),
					],
				},
				{
					input: "let one =1;let two = one;two;",
					expectedConstants: [1],
					expectedInstructions: [
						make(OpCodes.OpConstant, 0),
						make(OpCodes.OpSetGlobal, 0),
						make(OpCodes.OpGetGlobal, 0),
						make(OpCodes.OpSetGlobal, 1),
						make(OpCodes.OpGetGlobal, 1),
						make(OpCodes.OpPop, 0),
					],
				},
			]);
		});
	});
	it("should compile strings", () => {
		runCompilerTests([
			{
				input: '"hello"',
				expectedConstants: ["hello"],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpPop),
				],
			},
			{
				input: '"hello" + "world"',
				expectedConstants: ["hello", "world"],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpAdd),
					make(OpCodes.OpPop),
				],
			},
		]);
	});
	it("should compile arrays", () => {
		runCompilerTests([
			{
				input: "[]",
				expectedConstants: [],
				expectedInstructions: [make(OpCodes.OpArray, 0), make(OpCodes.OpPop)],
			},
			{
				input: "[1,2]",
				expectedConstants: [1, 2],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpArray, 2),
					make(OpCodes.OpPop),
				],
			},
			{
				input: "[1+2,3-4,5*6]",
				expectedConstants: [1, 2, 3, 4, 5, 6],
				expectedInstructions: [
					make(OpCodes.OpConstant, 0),
					make(OpCodes.OpConstant, 1),
					make(OpCodes.OpAdd),
					make(OpCodes.OpConstant, 2),
					make(OpCodes.OpConstant, 3),
					make(OpCodes.OpSub),
					make(OpCodes.OpConstant, 4),
					make(OpCodes.OpConstant, 5),
					make(OpCodes.OpMult),
					make(OpCodes.OpArray, 3),
					make(OpCodes.OpPop),
				],
			},
		]);
	});
});
const lexAndParse = (input: string) =>
	new Parser(new Lexer(input)).parseProgram();

const runCompilerTests = (
	tests: {
		input: string;
		expectedConstants: (number | boolean | string)[];
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

			case "string":
				testStringObject(actual[i] as StringObject, expConstant);
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

const testStringObject = (obj: StringObject, expected: string) => {
	expect(obj).toBeInstanceOf(StringObject);
	expect(obj.value).toBe(expected);
};
