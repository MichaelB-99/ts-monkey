import { describe, expect, it } from "bun:test";
import { LetStatement } from "../../ast/ast";
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
});
