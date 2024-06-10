import type { Token } from "../token/token";

export interface Node {
	tokenLiteral(): string;
}
export interface Statement extends Node {
	statementNode(): void;
}
export interface Expression extends Node {
	expressionNode(): void;
}

export class Program implements Node {
	public statements: Statement[] = [];
	tokenLiteral(): string {
		if (this.statements.length > 0) {
			return this.statements[0].tokenLiteral();
		}
		return "";
	}
}

export class LetStatement implements Statement {
	public name: Identifier | null = null;
	public value: string | null = null;
	constructor(public token: Token) {}
	statementNode() {}
	tokenLiteral(): string {
		return this.token.literal;
	}
}

export class Identifier implements Expression {
	constructor(
		public token: Token,
		public value: string,
	) {}
	expressionNode() {}
	tokenLiteral(): string {
		return this.token.literal;
	}
}
