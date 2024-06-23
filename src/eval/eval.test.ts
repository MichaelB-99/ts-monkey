import { describe, expect, it } from "bun:test";
import { Lexer } from "../lexer/lexer";
import { BooleanObject, IntegerObject } from "../object/object";
import { Parser } from "../parser/parser";
import { evaluate } from "./eval";
describe("eval", () => {
	it("should evaluate integer expressions", () => {
		const tests = [
			{ input: "5", expected: 5 },
			{ input: "10", expected: 10 },
			{ input: "-5", expected: -5 },
			{ input: "-10", expected: -10 },
		];
		for (const { expected, input } of tests) {
			const evaluated = testEval(input);
			testIntegerObject(evaluated as IntegerObject, expected);
		}
	});
	it("should evaluate boolean expressions", () => {
		const tests = [
			{ input: "true", expected: true },
			{ input: "false", expected: false },
		];
		for (const { expected, input } of tests) {
			const evaluated = testEval(input);
			testBooleanObject(evaluated as BooleanObject, expected);
		}
	});
	it("should evaluate bang operator", () => {
		const tests = [
			{ input: "!true", expected: false },
			{ input: "!false", expected: true },
			{ input: "!5", expected: false },
			{ input: "!!true", expected: true },
			{ input: "!!false", expected: false },
			{ input: "!!5", expected: true },
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			testBooleanObject(evaluated as BooleanObject, expected);
		}
	});
});

function testEval(input: string) {
	return evaluate(new Parser(new Lexer(input)).parseProgram());
}
function testIntegerObject(integerObj: IntegerObject, expected: number) {
	expect(integerObj).toBeInstanceOf(IntegerObject);
	expect(integerObj.value).toBe(expected);
}
function testBooleanObject(boolObj: BooleanObject, expected: boolean) {
	expect(boolObj).toBeInstanceOf(BooleanObject);
	expect(boolObj.value).toBe(expected);
}
