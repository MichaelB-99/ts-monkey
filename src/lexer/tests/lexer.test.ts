import { describe, it, expect } from "bun:test";
import { TokenType, type Token } from "../../token/token";
import { Lexer } from "../lexer";

describe("lexer", () => {
	it("lexes operators and delimiters", () => {
		const input = "=+(){},;";
		const tests: { expectedType: TokenType; expectedLiteral: string }[] = [
			{ expectedType: TokenType.ASSIGN, expectedLiteral: "=" },
			{ expectedType: TokenType.PLUS, expectedLiteral: "+" },
			{ expectedType: TokenType.LPAREN, expectedLiteral: "(" },
			{ expectedType: TokenType.RPAREN, expectedLiteral: ")" },
			{ expectedType: TokenType.LBRACE, expectedLiteral: "{" },
			{ expectedType: TokenType.RBRACE, expectedLiteral: "}" },
			{ expectedType: TokenType.COMMA, expectedLiteral: "," },
			{ expectedType: TokenType.SEMICOLON, expectedLiteral: ";" },
			{ expectedType: TokenType.EOF, expectedLiteral: "" },
		];
		const lexer = new Lexer(input);
		for (const test of tests) {
			const token = lexer.nextToken();
			expect(token.type).toBe(test.expectedType);
			expect(token.literal).toBe(test.expectedLiteral);
		}
	});
	it("lexes some identifiers and integers", () => {
		const input = `
		let five = 5;
		let ten = 10;

		let add = fn(x,y){
			x+y;
		};
		let result = add(five,ten);
		`;

		const tests: { expectedType: TokenType; expectedLiteral: string }[] = [
			{ expectedType: TokenType.LET, expectedLiteral: "let" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "five" },
			{ expectedType: TokenType.ASSIGN, expectedLiteral: "=" },
			{ expectedType: TokenType.INT, expectedLiteral: "5" },
			{ expectedType: TokenType.SEMICOLON, expectedLiteral: ";" },
			{ expectedType: TokenType.LET, expectedLiteral: "let" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "ten" },
			{ expectedType: TokenType.ASSIGN, expectedLiteral: "=" },
			{ expectedType: TokenType.INT, expectedLiteral: "10" },
			{ expectedType: TokenType.SEMICOLON, expectedLiteral: ";" },
			{ expectedType: TokenType.LET, expectedLiteral: "let" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "add" },
			{ expectedType: TokenType.ASSIGN, expectedLiteral: "=" },
			{ expectedType: TokenType.FUNCTION, expectedLiteral: "fn" },
			{ expectedType: TokenType.LPAREN, expectedLiteral: "(" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "x" },
			{ expectedType: TokenType.COMMA, expectedLiteral: "," },
			{ expectedType: TokenType.IDENT, expectedLiteral: "y" },
			{ expectedType: TokenType.RPAREN, expectedLiteral: ")" },
			{ expectedType: TokenType.LBRACE, expectedLiteral: "{" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "x" },
			{ expectedType: TokenType.PLUS, expectedLiteral: "+" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "y" },
			{ expectedType: TokenType.SEMICOLON, expectedLiteral: ";" },
			{ expectedType: TokenType.RBRACE, expectedLiteral: "}" },
			{ expectedType: TokenType.SEMICOLON, expectedLiteral: ";" },
			{ expectedType: TokenType.LET, expectedLiteral: "let" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "result" },
			{ expectedType: TokenType.ASSIGN, expectedLiteral: "=" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "add" },
			{ expectedType: TokenType.LPAREN, expectedLiteral: "(" },
			{ expectedType: TokenType.IDENT, expectedLiteral: "five" },
			{ expectedType: TokenType.COMMA, expectedLiteral: "," },
			{ expectedType: TokenType.IDENT, expectedLiteral: "ten" },
			{ expectedType: TokenType.RPAREN, expectedLiteral: ")" },
			{ expectedType: TokenType.SEMICOLON, expectedLiteral: ";" },
			{ expectedType: TokenType.EOF, expectedLiteral: "" },
		];
		const lexer = new Lexer(input);
		for (const test of tests) {
			const token = lexer.nextToken();
			expect(token.type).toBe(test.expectedType);
			expect(token.literal).toBe(test.expectedLiteral);
			console.log(token);
		}
	});
});