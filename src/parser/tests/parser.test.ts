import { describe, expect, it } from "bun:test";
import {
	BooleanLiteral,
	type Expression,
	ExpressionStatement,
	FunctionLiteral,
	Identifier,
	IfExpression,
	InfixExpression,
	IntegerLiteral,
	LetStatement,
	PrefixExpression,
	ReturnStatement,
} from "../../ast/ast";
import { Lexer } from "../../lexer/lexer";
import { Parser } from "../parser";

describe("parser", () => {
	it("should parse let statements", () => {
		const input = `
        let x = 5;
        let y = 10;
        let foobar = 838383; 
        `;
		const parser = new Parser(new Lexer(input));
		const program = parser.parseProgram();
		checkParserErrors(parser);
		expect(program).not.toBeNull();
		expect(program.statements).toHaveLength(3);
		const tests = ["x", "y", "foobar"];
		tests.forEach((test, i) => {
			const statement = program.statements[i] as LetStatement;
			expect(statement.tokenLiteral()).toBe("let");
			expect(statement).toBeInstanceOf(LetStatement);
			expect(statement.name?.value).toBe(test);
			expect(statement.name?.tokenLiteral()).toBe(test);
		});
	});
	it("should parse return statements", () => {
		const input = `
        return 5;
        return  10;
        return 993322;
        `;
		const parser = new Parser(new Lexer(input));
		const program = parser.parseProgram();
		checkParserErrors(parser);
		expect(program).not.toBeNull();
		expect(program.statements).toHaveLength(3);
		const tests = ["5", "10", "993322"];
		tests.forEach((_, i) => {
			const statement = program.statements[i] as ReturnStatement;
			expect(statement.tokenLiteral()).toBe("return");
			expect(statement).toBeInstanceOf(ReturnStatement);
		});
	});
	it("should parse identifiers", () => {
		const input = "foobar";
		const parser = new Parser(new Lexer(input));
		const program = parser.parseProgram();
		checkParserErrors(parser);
		const statement = program.statements[0] as ExpressionStatement;
		expect(program.statements).toHaveLength(1);
		expect(statement).toBeInstanceOf(ExpressionStatement);
		const expression = statement.expression as Identifier;
		expect(expression).toBeInstanceOf(Identifier);
		expect(expression.value).toBe("foobar");
	});
	it("should parse integers", () => {
		const input = "1337;";
		const parser = new Parser(new Lexer(input));
		const program = parser.parseProgram();
		checkParserErrors(parser);
		const statement = program.statements[0] as ExpressionStatement;
		expect(program.statements).toHaveLength(1);
		expect(statement).toBeInstanceOf(ExpressionStatement);
		const expression = statement.expression as IntegerLiteral;
		expect(expression).toBeInstanceOf(IntegerLiteral);
		expect(expression.value).toBe(1337);
		expect(expression.tokenLiteral()).toBe("1337");
	});

	it("should parse prefix expressions", () => {
		const tests = [
			{ input: "!5;", operator: "!", value: 5 },
			{ input: "-15", operator: "-", value: 15 },
			{ input: "-foobar", operator: "-", value: "foobar" },
			{ input: "!foobar", operator: "!", value: "foobar" },
			{ input: "!true", operator: "!", value: true },
			{ input: "!false", operator: "!", value: false },
		];
		for (const { input, value, operator } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			console.log(program);
			expect(program.statements).toHaveLength(1);
			const statement = program.statements[0] as ExpressionStatement;
			console.log(statement);
			expect(statement).toBeInstanceOf(ExpressionStatement);
			const expr = statement.expression as PrefixExpression;
			expect(expr).toBeInstanceOf(PrefixExpression);
			expect(expr.operator).toBe(operator);
			expect(testLiteralExpression(expr.rightExpression!, value)).toBe(true);
		}
	});
	it("should parse infix expressions", () => {
		const tests = [
			{ input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5 },
			{ input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5 },
			{ input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5 },
			{ input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5 },
			{ input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5 },
			{ input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5 },
			{ input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5 },
			{ input: "5 != 5;", leftValue: 5, operator: "!=", rightValue: 5 },
			{
				input: "true == true",
				leftValue: true,
				operator: "==",
				rightValue: true,
			},
			{
				input: "true != false",
				leftValue: true,
				operator: "!=",
				rightValue: false,
			},
			{
				input: "false == false",
				leftValue: false,
				operator: "==",
				rightValue: false,
			},
		];
		for (const { input, leftValue, operator, rightValue } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			expect(program.statements).toHaveLength(1);
			const statement = program.statements[0] as ExpressionStatement;
			expect(statement).toBeInstanceOf(ExpressionStatement);
			const expr = statement.expression as InfixExpression;
			console.log(statement);
			expect(expr).toBeInstanceOf(InfixExpression);
			testInfixExpression(expr, leftValue, operator, rightValue);
		}
	});

	it("should take into account operator precedence", () => {
		const tests = [
			{ input: "2+3-4/2", expected: "((2 + 3) - (4 / 2))" },
			{ input: "-a * b", expected: "((-a) * b)" },
			{
				input: "-a * b",
				expected: "((-a) * b)",
			},
			{
				input: "!-a",
				expected: "(!(-a))",
			},
			{
				input: "a + b + c",
				expected: "((a + b) + c)",
			},
			{
				input: "a + b - c",
				expected: "((a + b) - c)",
			},
			{
				input: "a * b * c",
				expected: "((a * b) * c)",
			},
			{
				input: "a * b / c",
				expected: "((a * b) / c)",
			},
			{
				input: "a + b / c",
				expected: "(a + (b / c))",
			},
			{
				input: "a + b * c + d / e - f",
				expected: "(((a + (b * c)) + (d / e)) - f)",
			},
			{
				input: "3 + 4; -5 * 5",
				expected: "(3 + 4)((-5) * 5)",
			},
			{
				input: "5 > 4 == 3 < 4",
				expected: "((5 > 4) == (3 < 4))",
			},
			{
				input: "5 < 4 != 3 > 4",
				expected: "((5 < 4) != (3 > 4))",
			},
			{
				input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
				expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
			},
			{
				input: "3 + 4 * 5 == 3 * 1 + 4 * 5;",
				expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
			},
			{ input: "5+6*2/2", expected: "(5 + ((6 * 2) / 2))" },
			{ input: "true", expected: "true" },
			{ input: "false", expected: "false" },
			{ input: "1+2*3 == true", expected: "((1 + (2 * 3)) == true)" },
			{
				input: "3 > 5 == false",
				expected: "((3 > 5) == false)",
			},
			{
				input: "3 < 5 == true",
				expected: "((3 < 5) == true)",
			},
			{ input: "1+-2*3", expected: "(1 + ((-2) * 3))" },
			{ input: "1+2+3+4", expected: "(((1 + 2) + 3) + 4)" },
			{ input: "1+(2+3)+4", expected: "((1 + (2 + 3)) + 4)" },
		];
		for (const { input, expected } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			const statement = program.statements[0] as ExpressionStatement;
			console.log(statement.expression);
			console.log(program.string());
			expect(program.string()).toBe(expected);
		}
	});
	it("should parse boolean expressions", () => {
		const tests = [
			{ input: "true", expected: true },
			{ input: "false", expected: false },
		];
		for (const { input, expected } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			console.log(program);
			expect(program.statements).toHaveLength(1);
			const statement = program.statements[0] as ExpressionStatement;
			console.log(statement);
			expect(statement).toBeInstanceOf(ExpressionStatement);
			const expr = statement.expression as BooleanLiteral;
			expect(expr).toBeInstanceOf(BooleanLiteral);
			expect(expr.value).toBe(expected);
		}
	});
	it("should parse if expressions", () => {
		const tests = [{ input: "if (x < y) { x };" }];
		for (const { input } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			expect(program.statements).toHaveLength(1);
			const statement = program.statements[0] as ExpressionStatement;
			console.log(statement);
			expect(statement).toBeInstanceOf(ExpressionStatement);
			const expr = statement.expression as IfExpression;
			expect(expr).toBeInstanceOf(IfExpression);
			testInfixExpression(expr.condition as InfixExpression, "x", "<", "y");

			expect(expr.consequence?.statements).toHaveLength(1);
			const consequence = expr.consequence
				?.statements[0] as ExpressionStatement;
			console.log(expr);
			expect(expr.consequence?.statements[0]).toBeInstanceOf(
				ExpressionStatement,
			);

			expect(consequence.expression).toBeInstanceOf(Identifier);
			testIdentifier(consequence.expression!, "x");
			expect(expr.alternative).toBeNull();
		}
	});
	it("should parse if else expressions", () => {
		const tests = [{ input: "if (x < y) { x } else { y }" }];
		for (const { input } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			console.log(program);
			expect(program.statements).toHaveLength(1);
			const statement = program.statements[0] as ExpressionStatement;
			console.log(statement);
			expect(statement).toBeInstanceOf(ExpressionStatement);
			const expr = statement.expression as IfExpression;
			expect(expr).toBeInstanceOf(IfExpression);
			testInfixExpression(expr.condition as InfixExpression, "x", "<", "y");

			expect(expr.alternative?.statements).toHaveLength(1);
			const alternative = expr.alternative
				?.statements[0] as ExpressionStatement;
			expect(alternative).toBeInstanceOf(ExpressionStatement);
			expect(alternative.expression).toBeInstanceOf(Identifier);
			testIdentifier(alternative.expression!, "y");
			expect(expr.alternative).not.toBeNull();
		}
	});
	it("should parse function literals", () => {
		const input = "fn(x,y) { x + y; }";
		const parser = new Parser(new Lexer(input));
		const program = parser.parseProgram();
		checkParserErrors(parser);
		expect(program.statements).toHaveLength(1);
		const statement = program.statements[0] as ExpressionStatement;
		expect(statement).toBeInstanceOf(ExpressionStatement);
		const expr = statement.expression as FunctionLiteral;
		expect(expr).toBeInstanceOf(FunctionLiteral);
		expect(expr.parameters).toHaveLength(2);
		testLiteralExpression(expr.parameters![0], "x");
		testLiteralExpression(expr.parameters![1], "y");
		expect(expr.body?.statements).toHaveLength(1);
		const bodyStatement = expr.body?.statements[0] as ExpressionStatement;
		expect(bodyStatement).toBeInstanceOf(ExpressionStatement);
		testInfixExpression(
			bodyStatement.expression as InfixExpression,
			"x",
			"+",
			"y",
		);
	});
	it("should parse functions with different parameter lengths", () => {
		const tests = [
			{ input: "fn(){}", expected: [] },
			{ input: "fn(x){}", expected: ["x"] },
			{ input: "fn(x,y,z){}", expected: ["x", "y", "z"] },
		];
		for (const { input, expected } of tests) {
			const parser = new Parser(new Lexer(input));
			const program = parser.parseProgram();
			checkParserErrors(parser);
			expect(program.statements).toHaveLength(1);
			const statement = program.statements[0] as ExpressionStatement;
			expect(statement).toBeInstanceOf(ExpressionStatement);
			const expr = statement.expression as FunctionLiteral;
			expect(expr).toBeInstanceOf(FunctionLiteral);
			expect(expr.parameters).toHaveLength(expected.length);
			expected.forEach((param, i) => {
				testLiteralExpression(expr.parameters![i], param);
			});
		}
	});
});

function testIntegerLiteral(intLiteral: Expression | null, value: number) {
	expect(intLiteral).toBeInstanceOf(IntegerLiteral);
	const integ = intLiteral as IntegerLiteral;
	expect(integ.value).toBe(value);
	expect(integ.tokenLiteral()).toBe(String(value));
	return true;
}
function checkParserErrors(parser: Parser) {
	if (!parser.errors.length) {
		return;
	}
	console.error(`parser has ${parser.errors.length} errors`);
	// biome-ignore lint/complexity/noForEach: <explanation>
	parser.errors.forEach((e) => console.error("parser error", e));
	throw new Error("");
}

function testLiteralExpression(
	expression: Expression,
	expected: string | number | boolean,
) {
	switch (typeof expected) {
		case "number":
			return testIntegerLiteral(expression, expected);

		case "string":
			return testIdentifier(expression, expected);

		case "boolean":
			return testBooleanLiteral(expression as BooleanLiteral, expected);
		default:
			throw new Error(`expected type ${typeof expected} not handled`);
	}
}
function testIdentifier(expression: Expression, value: string) {
	expect(expression).toBeInstanceOf(Identifier);
	expect((expression as Identifier).value).toBe(value);
	expect(expression.tokenLiteral()).toBe(value);
	return true;
}

function testInfixExpression(
	expression: InfixExpression,
	left: string | number | boolean,
	operator: string,
	right: string | number | boolean,
) {
	expect(expression).toBeInstanceOf(InfixExpression);
	testLiteralExpression(expression.leftExpr, left);
	expect(expression.operator).toBe(operator);
	testLiteralExpression(expression.rightExpr!, right);
}

function testBooleanLiteral(expression: BooleanLiteral, value: boolean) {
	expect(expression).toBeInstanceOf(BooleanLiteral);
	expect(expression.value).toBe(value);
	expect(expression.tokenLiteral()).toBe(String(value));
	return true;
}
