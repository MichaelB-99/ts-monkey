import { describe, expect, it } from "bun:test";
import { LetStatement, Program, ReturnStatement } from "../../ast/ast";
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
});

function checkParserErrors(parser: Parser) {
	if (!parser.errors.length) {
		return;
	}
	console.error(`parser has ${parser.errors.length} errors`);
	// biome-ignore lint/complexity/noForEach: <explanation>
	parser.errors.forEach((e) => console.error("parser error", e));
	throw new Error("");
}
