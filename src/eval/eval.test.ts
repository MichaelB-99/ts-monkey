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
			{ input: "5 + 5", expected: 10 },
			{ input: "200 - 100", expected: 100 },
			{ input: "5 + 5 + 5 + 5 - 10", expected: 10 },
			{ input: "2 * 2 * 2 * 2 * 2", expected: 32 },
			{ input: "-50 + 100 + -50", expected: 0 },
			{ input: "5 * 2 + 10", expected: 20 },
			{ input: "5 + 2 * 10", expected: 25 },
			{ input: "20 + 2 * -10", expected: 0 },
			{ input: "50 / 2 * 2 + 10", expected: 60 },
			{ input: "2 * (5 + 10)", expected: 30 },
			{ input: "3 * 3 * 3 + 10", expected: 37 },
			{ input: "3 * (3 * 3) + 10", expected: 37 },
			{ input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
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
	it("should evaluate boolean expressions", () => {
		const tests = [
			{ input: "!true", expected: false },
			{ input: "!false", expected: true },
			{ input: "!5", expected: false },
			{ input: "!!true", expected: true },
			{ input: "!!false", expected: false },
			{ input: "1<2", expected: true },
			{ input: "1>2", expected: false },
			{ input: "1<1", expected: false },
			{ input: "1>1", expected: false },
			{ input: "1==1", expected: true },
			{ input: "1!=1", expected: false },
			{ input: "1==2", expected: false },
			{ input: "1!=2", expected: true },
			{ input: "true == true", expected: true },
			{ input: "false == false", expected: true },
			{ input: "true == false", expected: false },
			{ input: "true != false", expected: true },
			{ input: "false != true", expected: true },
			{ input: "(1 < 2) == true", expected: true },
			{ input: "(1 < 2) == false", expected: false },
			{ input: "(1 > 2) == true", expected: false },
			{ input: "(1 > 2) == false", expected: true },
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
