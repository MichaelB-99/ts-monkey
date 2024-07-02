import { describe, expect, it } from "bun:test";
import { Lexer } from "../lexer/lexer";
import {
	BooleanObject,
	ErrorObject,
	FunctionObject,
	IntegerObject,
	NULL_OBJ,
	type NullObject,
	StringObject,
} from "../object/object";
import { Parser } from "../parser/parser";
import { Environment } from "./environment";
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
	it("should evaluate if else expressions", () => {
		const tests = [
			{ input: "if(true){10}", expected: 10 },
			{ input: "if (false) { 10 }", expected: null },
			{ input: "if (1) { 10 }", expected: 10 },
			{ input: "if (1 < 2) { 10 }", expected: 10 },
			{ input: "if (1 > 2) { 10 }", expected: null },
			{ input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
			{ input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			if (typeof expected === "number") {
				testIntegerObject(evaluated as IntegerObject, expected);
			} else {
				testNullObject(evaluated as NullObject);
			}
		}
	});
	it("should evaluate return statements", () => {
		const tests = [
			{ input: "return 10;", expected: 10 },
			{ input: "return 10; 9;", expected: 10 },
			{ input: "return 2 * 5; 9;", expected: 10 },
			{ input: "9; return 2 * 5; 9;", expected: 10 },
			{ input: "if(true){if(true){return 1} return 9}", expected: 1 },
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			testIntegerObject(evaluated as IntegerObject, expected);
		}
	});
	it("should handle errors", () => {
		const tests = [
			{
				input: "5 + true;",
				expected: "type mismatch: INTEGER + BOOLEAN",
			},
			{
				input: "5 + true; 5;",
				expected: "type mismatch: INTEGER + BOOLEAN",
			},
			{
				input: "-true",
				expected: "unknown operator: -BOOLEAN",
			},
			{
				input: "true + false;",
				expected: "unknown operator: BOOLEAN + BOOLEAN",
			},
			{
				input: "5; true + false; 5",
				expected: "unknown operator: BOOLEAN + BOOLEAN",
			},
			{
				input: "if (10 > 1) { true + false; }",
				expected: "unknown operator: BOOLEAN + BOOLEAN",
			},
			{
				input: `
				132
				if (10 > 1) {
				if (10 > 1) {
				return true + false;
				}
				return 1;
				}
				`,
				expected: "unknown operator: BOOLEAN + BOOLEAN",
			},
			{ input: "foobar", expected: "identifier not found: foobar" },
			{
				input: `"hello" - "world"`,
				expected: "unknown operator: STRING - STRING",
			},
			{
				input: `"hello" || false`,
				expected: "type mismatch: STRING || BOOLEAN",
			},
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			expect(evaluated).toBeInstanceOf(ErrorObject);

			console.log(input);
			expect((evaluated as ErrorObject).msg).toBe(expected);
		}
	});
	it("should evaluate let statements", () => {
		const tests = [
			{ input: "let a = 5; a;", expected: 5 },
			{ input: "let a = 5 * 5; a;", expected: 25 },
			{ input: "let a = 5; let b = a; b;", expected: 5 },
			{ input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 },
		];
		for (const { input, expected } of tests) {
			testIntegerObject(testEval(input) as IntegerObject, expected);
		}
	});
	it("should evaluate functions", () => {
		const input = "fn(x){x+2}";
		const evaluated = testEval(input) as FunctionObject;
		const params = evaluated.params;
		expect(evaluated).toBeInstanceOf(FunctionObject);
		expect(params).toHaveLength(1);
		expect(params[0].string()).toBe("x");
		const expectedBody = "(x + 2)";
		expect(evaluated.body.string()).toBe(expectedBody);
	});
	it("should evaluate called functions", () => {
		const tests = [
			{ input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
			{
				input: "let identity = fn(x) { return x; }; identity(5);",
				expected: 5,
			},
			{ input: "let double = fn(x) { x * 2; }; double(5);", expected: 10 },
			{ input: "let add = fn(x, y) { x + y; }; add(5, 5);", expected: 10 },
			{
				input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
				expected: 20,
			},
			{ input: "fn(x) { x; }(5)", expected: 5 },
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			testIntegerObject(evaluated as IntegerObject, expected);
		}
	});
	it("should evaluate closures", () => {
		const input = `
		let makeAdder = fn(x){
			return fn(y){
				return x + y;
			}
		}
		let addFive = makeAdder(5)
		addFive(10) 
		`;
		testIntegerObject(testEval(input) as IntegerObject, 15);
	});
	it("should evaluate string literals", () => {
		const input = `"hello world"`;
		const evaluated = testEval(input);
		expect(evaluated).toBeInstanceOf(StringObject);
		expect((evaluated as StringObject).value).toBe("hello world");
	});
	it("should evaluate concatenated strings ", () => {
		const input = `"hello" + " " + "world"`;
		const evaluated = testEval(input);
		expect(evaluated).toBeInstanceOf(StringObject);
		expect((evaluated as StringObject).value).toBe("hello world");
	});
	it("should evaluate string comparison", () => {
		const tests = [
			{
				input: `"hello" == "hello"`,
				expected: true,
			},
			{
				input: `"hello" != "world"`,
				expected: true,
			},
			{
				input: `"hello" == "world"`,
				expected: false,
			},
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			expect(evaluated).toBeInstanceOf(BooleanObject);
			expect((evaluated as BooleanObject).value).toBe(expected);
		}
	});
	it("should evaluate logical OR operator", () => {
		const tests = [
			{
				input: "false || true",
				expected: true,
			},
			{
				input: "false || false",
				expected: false,
			},
			{
				input: "true || false",
				expected: true,
			},
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			expect(evaluated).toBeInstanceOf(BooleanObject);
			expect((evaluated as BooleanObject).value).toBe(expected);
		}
	});
	it("should evaluate logical AND operator", () => {
		const tests = [
			{
				input: "true && true",
				expected: true,
			},
			{
				input: "true && false",
				expected: false,
			},
			{
				input: "false && false",
				expected: false,
			},
			{
				input: "100>99 && true==true",
				expected: true,
			},
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			expect(evaluated).toBeInstanceOf(BooleanObject);
			expect((evaluated as BooleanObject).value).toBe(expected);
		}
	});
});

function testEval(input: string) {
	return evaluate(
		new Parser(new Lexer(input)).parseProgram(),
		new Environment(),
	);
}
function testIntegerObject(integerObj: IntegerObject, expected: number) {
	expect(integerObj).toBeInstanceOf(IntegerObject);
	expect(integerObj.value).toBe(expected);
}
function testBooleanObject(boolObj: BooleanObject, expected: boolean) {
	expect(boolObj).toBeInstanceOf(BooleanObject);
	expect(boolObj.value).toBe(expected);
}

function testNullObject(obj: NullObject) {
	expect(obj).toBe(NULL_OBJ);
}
