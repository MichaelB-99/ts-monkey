import { describe, expect, it } from "bun:test";
import { Compiler } from "../compiler/compiler";
import { Lexer } from "../lexer/lexer";
import {
	BooleanObject,
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
