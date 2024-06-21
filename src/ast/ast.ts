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
		public value?: Expression | null,
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

export class IntegerLiteral implements Expression {
	public value: number | null = null;
	constructor(public token: Token) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return this.token.literal;
	}
}

export class PrefixExpression implements Expression {
	public rightExpression: Expression | null = null;
	constructor(
		public token: Token,
		public operator: string,
	) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `(${this.operator}${this.rightExpression?.string()})`;
	}
}

export class InfixExpression implements Expression {
	public rightExpr: Expression | null = null;
	constructor(
		public token: Token,
		public operator: string,
		public leftExpr: Expression,
	) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `(${this.leftExpr.string()} ${this.operator} ${this.rightExpr?.string()})`;
	}
}
export class BooleanLiteral implements Expression {
	constructor(
		public token: Token,
		public value: boolean,
	) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return this.token.literal;
	}
}

export class IfExpression implements Expression {
	public condition: Expression | null = null;
	public consequence: BlockStatement | null = null;
	public alternative: BlockStatement | null = null;

	constructor(public token: Token) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `if ${this.condition?.string()} ${this.consequence?.string()} ${this.alternative ? `else ${this.alternative.string()}` : ""} `;
	}
}
export class BlockStatement implements Statement {
	public statements: Statement[] = [];
	constructor(public token: Token) {}
	statementNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return this.statements.map((s) => s.string()).join("");
	}
}
export class FunctionLiteral implements Expression {
	public parameters: Identifier[] | null = null;
	public body: BlockStatement | null = null;
	constructor(public token: Token) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `${this.tokenLiteral()}(${this.parameters?.map((p) => p.string()).join(",")})${this.body?.string()}`;
	}
}
export class CallExpression implements Expression {
	constructor(
		public token: Token,
		public func: Expression | null,
		public args: Expression[] | null,
	) {}
	expressionNode(): void {}
	tokenLiteral(): string {
		return this.token.literal;
	}
	string(): string {
		return `${this.func?.string()}(${this.args?.map((a) => a.string()).join(", ")})`;
	}
}
