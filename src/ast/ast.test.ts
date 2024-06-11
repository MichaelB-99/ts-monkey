import { describe, expect, it } from "bun:test";
import { TokenType } from "../token/token";
import { Identifier, LetStatement, Program } from "./ast";
describe("ast", () => {
	it("should return the string of the program given an ast", () => {
		const program = new Program();
		program.statements = [
			new LetStatement(
				{ type: TokenType.LET, literal: "let" },
				new Identifier({ type: TokenType.IDENT, literal: "myVar" }, "myVar"),
				new Identifier(
					{ type: TokenType.IDENT, literal: "anotherVar" },
					"anotherVar",
				),
			),
		];
		expect(program.string()).toBe("let myVar = anotherVar;");
	});
});
