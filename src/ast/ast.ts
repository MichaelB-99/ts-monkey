import type { Token } from "../token/token";

export interface Node {
	tokenLiteral(): string;
	string(): string;
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
	string(): string {
		return this.statements.map((s) => s.string()).join("");
	}
}

export class LetStatement implements Statement {
	constructor(
		public token: Token,
		public name?: Identifier | null,
		public value?: Identifier | null,
	) {}
	statementNode() {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `${this.tokenLiteral()} ${this.name?.string()} = ${this.value?.string() || ""};`;
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
	string(): string {
		return this.value;
	}
}

export class ReturnStatement implements Statement {
	public value: Expression | null = null;
	constructor(public token: Token) {}
	statementNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `${this.tokenLiteral()} ${this.value?.string() || ""};`;
	}
}

export class ExpressionStatement implements Statement {
	public expression: Expression | null = null;
	constructor(public token: Token) {}
	statementNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return this.expression?.string() || "";
	}
}
