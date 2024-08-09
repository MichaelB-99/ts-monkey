import { describe, expect, it } from "bun:test";
import { Compiler } from "../compiler/compiler";
import { Lexer } from "../lexer/lexer";
import {
	BooleanObject,
	IntegerObject,
	type InternalObject,
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
			{ input: "true", expected: true },
			{ input: "false", expected: false },
			{ input: "!true", expected: false },
			{ input: "!!true", expected: true },
			{ input: "!false", expected: true },
			{ input: "!5", expected: false },
			{ input: "!!5", expected: true },
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
	switch (typeof expected) {
		case "number":
			testIntegerObject(actual, expected);
			break;

		case "boolean":
			testBooleanObject(actual as BooleanObject, expected);
			break;

		default:
			break;
	}
};
function testBooleanObject(boolObj: BooleanObject, expected: boolean) {
	expect(boolObj).toBeInstanceOf(BooleanObject);
	expect(boolObj.value).toBe(expected);
}
