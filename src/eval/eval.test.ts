import { describe, expect, it } from "bun:test";
import { Lexer } from "../lexer/lexer";
import {
	ArrayObject,
	BooleanObject,
	ErrorObject,
	FunctionObject,
	IntegerObject,
	NULL_OBJ,
	type NullObject,
	ObjectType,
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
			{
				input: "5 <= false",
				expected: "type mismatch: INTEGER <= BOOLEAN",
			},
			{
				input: `5 >= "hi"`,
				expected: "type mismatch: INTEGER >= STRING",
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
	it("should evaluate less than or equal and greater than or equal operators", () => {
		const tests = [
			{
				input: "5>=5",
				expected: true,
			},
			{
				input: "10>=9",
				expected: true,
			},
			{
				input: "100<=200",
				expected: true,
			},
			{
				input: "200<=100",
				expected: false,
			},
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			expect(evaluated).toBeInstanceOf(BooleanObject);
			expect((evaluated as BooleanObject).value).toBe(expected);
		}
	});
	it("should evaluate builtin functions", () => {
		const tests = [
			{ input: `len("")`, expected: 0 },
			{ input: `len("four")`, expected: 4 },
			{ input: `len("hello world")`, expected: 11 },
			{
				input: "len(1)",
				expected: "argument to 'len' not supported, got INTEGER",
			},
			{
				input: `len("one", "two")`,
				expected: "wrong number of arguments. got=2, want=1",
			},
			{ input: "len([1,2])", expected: 2 },
			{ input: "first([1,2])", expected: 1 },
			{ input: "last([1,2])", expected: 2 },
			{ input: `rest(["hello", "world","!"])`, expected: ["world", "!"] },
			{ input: `push(["hello"],"world")`, expected: ["hello", "world"] },
			{ input: "map([1,2,3,4],fn(x){x*2})", expected: [2, 4, 6, 8] },
			{ input: "map([1,2,3,4],fn(_,i){i})", expected: [0, 1, 2, 3] },
			{ input: 'find(["a","ab","abc"],fn(x){len(x)>2})', expected: "abc" },
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);

			switch (typeof expected) {
				case "number":
					testIntegerObject(evaluated as IntegerObject, expected);
					break;

				case "string":
					if (evaluated instanceof StringObject) {
						return expect(evaluated.value).toBe(expected);
					}

					expect(evaluated).toBeInstanceOf(ErrorObject);
					break;

				case "object": {
					expect(evaluated).toBeInstanceOf(ArrayObject);
					const values = (evaluated as ArrayObject).elements.map((a) =>
						a?.type() === ObjectType.INTEGER_OBJ
							? Number(a?.inspect())
							: a?.inspect(),
					);
					expected.forEach((el) => expect(values).toContain(el));
					break;
				}
				default:
					break;
			}
		}
	});
	it("should evaluate array literals", () => {
		const input = "[1,2*2,3+3]";
		const evaluated = testEval(input) as ArrayObject;
		expect(evaluated).toBeInstanceOf(ArrayObject);
		testIntegerObject(evaluated.elements[0] as IntegerObject, 1);
		testIntegerObject(evaluated.elements[1] as IntegerObject, 4);
		testIntegerObject(evaluated.elements[2] as IntegerObject, 6);
	});
	it("should evaluate index expressions", () => {
		const tests = [
			{
				input: "[1, 2, 3][0]",

				expected: 1,
			},
			{
				input: "[1, 2, 3][1]",

				expected: 2,
			},
			{
				input: "[1, 2, 3][2]",

				expected: 3,
			},
			{
				input: "let i = 0; [1][i];",

				expected: 1,
			},
			{
				input: "[1, 2, 3][1 + 1];",

				expected: 3,
			},
			{
				input: "let myArray = [1, 2, 3]; myArray[2];",

				expected: 3,
			},
			{
				input: "let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];",

				expected: 6,
			},
			{
				input: "let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]",

				expected: 2,
			},
			{
				input: "[1, 2, 3][3]",

				expected: null,
			},
			{
				input: "[1, 2, 3][-1]",

				expected: null,
			},
			{ input: `["hello"][0]`, expected: "hello" },
			{ input: `"hello world!"[4]`, expected: "o" },
		];
		for (const { input, expected } of tests) {
			const evaluated = testEval(input);
			if (evaluated instanceof IntegerObject) {
				testIntegerObject(evaluated, expected as number);
			} else if (evaluated instanceof StringObject) {
				expect(evaluated.value).toBe(expected as string);
			} else {
				testNullObject(evaluated as NullObject);
			}
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
