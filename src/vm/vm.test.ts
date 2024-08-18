import { describe, expect, it } from "bun:test";
import { Compiler } from "../compiler/compiler";
import { Lexer } from "../lexer/lexer";
import {
	type ArrayObject,
	BooleanObject,
	ErrorObject,
	HashObject,
	IntegerObject,
	type InternalObject,
	NULL_OBJ,
	type StringObject,
} from "../object/object";
import { Parser } from "../parser/parser";
import { VM } from "./vm";
const testIntegerObject = (obj: InternalObject, expected: number) => {
	expect(obj).toBeInstanceOf(IntegerObject);
	expect((obj as IntegerObject).value).toBe(expected);
};
const lexAndParse = (input: string) =>
	new Parser(new Lexer(input)).parseProgram();
describe("vm", () => {
	it("should execute integer arithmetic", () => {
		runVmTests([
			{ input: "1", expected: 1 },
			{ input: "2", expected: 2 },
			{ input: "1+2", expected: 3 },
			{ input: "1;2;", expected: 2 },
			{ input: "1 * 2", expected: 2 },
			{ input: "4 / 2", expected: 2 },
			{ input: "50 / 2 * 2 + 10 - 5", expected: 55 },
			{ input: "5 * (2 + 10)", expected: 60 },
			{ input: "5 * 2 + 10", expected: 20 },
			{ input: "5 + 5 + 5 + 5 - 10", expected: 10 },
			{ input: "2 * 2 * 2 * 2 * 2", expected: 32 },
			{ input: "5 * 2 + 10", expected: 20 },
			{ input: "5 + 2 * 10", expected: 25 },
			{ input: "5 * (2 + 10)", expected: 60 },
		]);
	});

	it("should execute boolean expressions", () => {
		runVmTests([
			{ input: "true||false", expected: true },
			{ input: "false||true", expected: true },
			{ input: "false||false", expected: false },
			{ input: "false && true", expected: false },
			{ input: "true && false", expected: false },
			{ input: "true && true", expected: true },
			{ input: "[true][0] && [false,true][1]", expected: true },
			{ input: "2>1", expected: true },
			{ input: "1<2", expected: true },
			{ input: "1<=2", expected: true },
			{ input: "5>=2", expected: true },
			{ input: "2>=2", expected: true },
			{ input: "1>=1", expected: true },
			{ input: "(1 < 2) == true", expected: true },
			{ input: "(1 < 2) == false", expected: false },
			{ input: "(1 > 2) == true", expected: false },
			{ input: "(1 > 2) == false", expected: true },
			{ input: "true==true", expected: true },
			{ input: "false==false", expected: true },
			{ input: "true!=false", expected: true },
			{ input: "false==true", expected: false },
			{ input: '"hi"=="hi"', expected: true },
			{ input: '"hi"!="a"', expected: true },
			{ input: '"hi"=="a"', expected: false },
			{ input: "true", expected: true },
			{ input: "false", expected: false },
			{ input: "!true", expected: false },
			{ input: "!!true", expected: true },
			{ input: "!false", expected: true },
			{ input: "!5", expected: false },
			{ input: "!!5", expected: true },
			{ input: "!(if(false){100})", expected: true },
			{ input: "if(if(false){10}){10} else {20}", expected: 20 },
		]);
	});
	it("should handle operator errors", () => {
		runVmTests([
			{
				input: "[]==true",
				expected: new ErrorObject("type mismatch: ARRAY == BOOLEAN"),
			},
			{
				input: `"hi" > "a"`,
				expected: new ErrorObject("operator > cannot be used with strings"),
			},
		]);
	});
	it("should execute if expressions", () => {
		runVmTests([
			{ input: "if (true) { 10 }", expected: 10 },
			{ input: "if (true) { 10 } else { 20 }", expected: 10 },
			{ input: "if (false) { 10 } ", expected: null },
			{ input: "if (false) { 10 } else { 20 } ", expected: 20 },
			{ input: "if (1) { 10 }", expected: 10 },
			{ input: "if (1 < 2) { 10 }", expected: 10 },
			{ input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
			{ input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
		]);
	});
	it("should execute let statements/identifiers", () => {
		runVmTests([
			{ input: "let one =1; one;", expected: 1 },
			{ input: "let one =1; let two = 2; one+two;", expected: 3 },
			{ input: "let one =1; let two = one+one; one + two;", expected: 3 },
		]);
	});
	it("should execute strings", () => {
		runVmTests([
			{
				input: '"hello"',
				expected: "hello",
			},
			{
				input: '"hello" + " " + "world"',
				expected: "hello world",
			},
		]);
	});
	it("should execute arrays", () => {
		runVmTests([
			{
				input: "[]",
				expected: [],
			},
			{
				input: "[1,2,3]",
				expected: [1, 2, 3],
			},
			{
				input: "[1+1,2*2,3/3]",
				expected: [2, 4, 1],
			},
			{
				input: "[1+2,3*4,5+6]",
				expected: [3, 12, 11],
			},
		]);
	});
	describe("hashes", () => {
		it("should execute hashes", () => {
			runVmTests([
				{
					input: "{}",
					expected: new Map(),
				},
				{
					input: "{1:2}",
					expected: new Map([[1, 2]]),
				},
				{
					input: "{1+1: 2*2, 3+3: 4*4}",
					expected: new Map([
						[2, 4],
						[6, 16],
					]),
				},
			]);
		});
		it("should handle hash key errors", () => {
			runVmTests([
				{
					input: "{[1]:2}",
					expected: new ErrorObject("cannot use ARRAY as hash key"),
				},
				{
					input: "{[1]:2, 5:10}",
					expected: new ErrorObject("cannot use ARRAY as hash key"),
				},
			]);
		});
	});
	it("should execute index expressions", () => {
		runVmTests([
			{
				input: "[1,2,3][0]",
				expected: 1,
			},
			{ input: '{"hello":"world"}["hello"]', expected: "world" },
			{ input: '{"hello":"world"}["h" + "ello"]', expected: "world" },
			{ input: "{2:4}[1+1]", expected: 4 },
			{ input: "{2:4}[1]", expected: null },
			{ input: '{"hello":"world"}["hi"]', expected: null },
			{ input: '"hi"[0]', expected: "h" },
			{ input: 'let a = "hi"; a[0]', expected: "h" },
			{ input: '"hi"[2]', expected: null },
			{ input: '"hi"[0+1]', expected: "i" },
			{ input: "[[1]][0]", expected: [1] },
			{ input: "[][0]", expected: null },
		]);
	});
	it("should handle index errors", () => {
		runVmTests([
			{
				input: "true[0]",
				expected: new ErrorObject("BOOLEAN is not indexable"),
			},
			{
				input: "1[0]",
				expected: new ErrorObject("INTEGER is not indexable"),
			},
		]);
	});
});

const runVmTests = (
	tests: {
		input: string;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		expected: any;
	}[],
) => {
	for (const { input, expected } of tests) {
		const program = lexAndParse(input);
		const compiler = new Compiler();
		compiler.compile(program);
		const bytecode = compiler.bytecode();
		const vm = new VM(compiler.instructions, bytecode);
		vm.run();
		const stackElement = vm.lastPoppedElement();
		testExpectedObject(stackElement!, expected);
	}
};

// biome-ignore lint/suspicious/noExplicitAny:
const testExpectedObject = (actual: InternalObject, expected: any) => {
	if (expected === null) {
		expect(actual).toBe(NULL_OBJ);
	}
	if (expected instanceof ErrorObject) {
		const error = actual as ErrorObject;
		expect(error.msg).toBe(expected.msg);
	}
	if (Array.isArray(expected)) {
		const arr = actual as ArrayObject;
		expect(arr.elements).toHaveLength(expected.length);
		expected.forEach((exp, i) => {
			testExpectedObject(arr.elements[i]!, exp);
		});
		return;
	}
	if (expected instanceof Map) {
		const hash = actual as HashObject;
		expect(hash).toBeInstanceOf(HashObject);
		expect(hash.pairs.size).toBe(expected.size);
		for (const [expKey, expValue] of expected) {
			const val = hash.pairs.get(expKey)!.value as
				| StringObject
				| IntegerObject
				| BooleanObject;
			expect(val.value).toBe(expValue);
		}
	}
	switch (typeof expected) {
		case "number":
			testIntegerObject(actual, expected);
			break;

		case "boolean":
			testBooleanObject(actual as BooleanObject, expected);
			break;

		case "string":
			expect((actual as StringObject).value).toBe(expected);
			break;
		default:
			break;
	}
};
function testBooleanObject(boolObj: BooleanObject, expected: boolean) {
	expect(boolObj).toBeInstanceOf(BooleanObject);
	expect(boolObj.value).toBe(expected);
}
