import {
	Identifier,
	LetStatement,
	Program,
	ReturnStatement,
	type Statement,
} from "../ast/ast";
import type { Lexer } from "../lexer/lexer";
import { type Token, TokenType } from "../token/token";

export class Parser {
	public currToken!: Token;
	public peekToken!: Token;
	public errors: string[] = [];
	constructor(private lexer: Lexer) {
		this.nextToken();
		this.nextToken();
	}
	nextToken() {
		this.currToken = this.peekToken;
		this.peekToken = this.lexer.nextToken();
	}

	parseProgram() {
		const program = new Program();
		while (!this.currTokenIs(TokenType.EOF)) {
			const statement = this.parseStatement();
			if (statement) {
				program.statements.push(statement);
			}
			this.nextToken();
		}
		return program;
	}

	parseStatement() {
		switch (this.currToken?.type) {
			case TokenType.LET:
				return this.parseLetStatement();
			case TokenType.RETURN:
				return this.parseReturnStatement();

			default:
				break;
		}
	}

	parseLetStatement() {
		const statement = new LetStatement(this.currToken);
		if (!this.expectPeek(TokenType.IDENT)) {
			return null;
		}
		statement.name = new Identifier(this.currToken, this.currToken.literal);
		if (!this.expectPeek(TokenType.ASSIGN)) {
			return null;
		}
		// TODO: We're skipping the expressions until we encounter a semicolon
		while (!this.currTokenIs(TokenType.SEMICOLON)) {
			this.nextToken();
		}
		return statement;
	}
	parseReturnStatement() {
		const statement = new ReturnStatement(this.currToken);
		this.nextToken();
		// TODO we are currently skipping expressions
		while (!this.currTokenIs(TokenType.SEMICOLON)) {
			this.nextToken();
		}
		return statement;
	}
	currTokenIs(type: TokenType) {
		return this.currToken.type === type;
	}
	peekTokenIs(type: TokenType) {
		return this.peekToken.type === type;
	}
	expectPeek(type: TokenType) {
		if (this.peekTokenIs(type)) {
			this.nextToken();
			return true;
		}
		this.peekError(type);
		return false;
	}
	peekError(type: TokenType) {
		const msg = `expected next token to be ${type}, got ${this.peekToken.type}`;
		this.errors.push(msg);
	}
}
