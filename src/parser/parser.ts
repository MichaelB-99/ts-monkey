import {
	BlockStatement,
	BooleanLiteral,
	CallExpression,
	type Expression,
	ExpressionStatement,
	FunctionLiteral,
	Identifier,
	IfExpression,
	InfixExpression,
	IntegerLiteral,
	LetStatement,
	PrefixExpression,
	Program,
	ReturnStatement,
} from "../ast/ast";
import type { Lexer } from "../lexer/lexer";
import { type Token, TokenType } from "../token/token";
import type { Maybe } from "../utils/types";
type PrefixParseFn = () => Maybe<Expression>;
type InfixParseFn = (left: Expression) => Expression;
type ParseFnsMap<T extends PrefixParseFn | InfixParseFn> = Partial<
	Record<TokenType, T>
>;
enum Precedences {
	LOWEST = 0,
	EQUALS = 1,
	LESSGREATER = 2,
	SUM = 3,
	PRODUCT = 4,
	PREFIX = 5,
	CALL = 6,
}
export class Parser {
	public currToken!: Token;
	public peekToken!: Token;
	public errors: string[] = [];
	public prefixParseFnsMap: ParseFnsMap<PrefixParseFn> = {};
	public infixParseFnsMap: ParseFnsMap<InfixParseFn> = {};
	public precedencesMap: Partial<Record<TokenType, Precedences>> = {
		"==": Precedences.EQUALS,
		"!=": Precedences.EQUALS,
		">": Precedences.LESSGREATER,
		"<": Precedences.LESSGREATER,
		"+": Precedences.SUM,
		"-": Precedences.SUM,
		"*": Precedences.PRODUCT,
		"/": Precedences.PRODUCT,
		"(": Precedences.CALL,
	};

	constructor(private lexer: Lexer) {
		this.registerPrefix(TokenType.IDENT, this.parseIdentifier);
		this.registerPrefix(TokenType.TRUE, this.parseBoolean);
		this.registerPrefix(TokenType.FALSE, this.parseBoolean);
		this.registerPrefix(TokenType.LPAREN, this.parseGroupedExpression);
		this.registerPrefix(TokenType.INT, this.parseIntegerLiteral);
		this.registerPrefix(TokenType.BANG, this.parsePrefixExpression);
		this.registerPrefix(TokenType.MINUS, this.parsePrefixExpression);
		this.registerPrefix(TokenType.IF, this.parseIfExpression);
		this.registerPrefix(TokenType.FUNCTION, this.parseFunctionLiteral);
		this.registerInfix(TokenType.PLUS, this.parseInfixExpression);
		this.registerInfix(TokenType.MINUS, this.parseInfixExpression);
		this.registerInfix(TokenType.SLASH, this.parseInfixExpression);
		this.registerInfix(TokenType.ASTERISK, this.parseInfixExpression);
		this.registerInfix(TokenType.EQ, this.parseInfixExpression);
		this.registerInfix(TokenType.NOT_EQ, this.parseInfixExpression);
		this.registerInfix(TokenType.LT, this.parseInfixExpression);
		this.registerInfix(TokenType.GT, this.parseInfixExpression);
		this.registerInfix(TokenType.LPAREN, this.parseCallExpression);

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
				return this.parseExpressionStatement();
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

		this.nextToken();
		statement.value = this.parseExpression(Precedences.LOWEST);
		if (this.peekTokenIs(TokenType.SEMICOLON)) {
			this.nextToken();
		}
		return statement;
	}
	parseReturnStatement() {
		const statement = new ReturnStatement(this.currToken);
		this.nextToken();
		statement.value = this.parseExpression(Precedences.LOWEST);
		if (this.peekTokenIs(TokenType.SEMICOLON)) {
			this.nextToken();
		}
		return statement;
	}
	parseExpressionStatement() {
		const statement = new ExpressionStatement(this.currToken);
		statement.expression = this.parseExpression(Precedences.LOWEST);
		if (this.peekTokenIs(TokenType.SEMICOLON)) {
			this.nextToken();
		}
		return statement;
	}
	noPrefixParseFnError = (type: TokenType) => {
		this.errors.push(`no parse function found for type ${type}`);
	};
	parseExpression(precedence: Precedences) {
		const prefixFn = this.prefixParseFnsMap[this.currToken.type];
		if (!prefixFn) {
			this.noPrefixParseFnError(this.currToken.type);
			return null;
		}
		let leftHandExpr = prefixFn();
		while (
			!this.peekTokenIs(TokenType.SEMICOLON) &&
			precedence < this.peekPrecedence()
		) {
			const infixFn = this.infixParseFnsMap[this.peekToken.type];
			if (!infixFn) return leftHandExpr;
			this.nextToken();
			if (leftHandExpr) {
				leftHandExpr = infixFn(leftHandExpr);
			}
		}
		return leftHandExpr;
	}
	parseIntegerLiteral = () => {
		const statement = new IntegerLiteral(this.currToken);
		const value = Number.parseInt(this.currToken.literal);
		if (Number.isNaN(value)) {
			this.errors.push(`could not parse ${this.currToken.literal} as integer`);
			return null;
		}
		statement.value = value;
		return statement;
	};
	parseBoolean = () => {
		return new BooleanLiteral(this.currToken, this.currTokenIs(TokenType.TRUE));
	};
	parsePrefixExpression = () => {
		const expr = new PrefixExpression(this.currToken, this.currToken.literal);
		this.nextToken();
		expr.rightExpression = this.parseExpression(Precedences.PREFIX);
		return expr;
	};

	parseInfixExpression = (left: Expression) => {
		const expression = new InfixExpression(
			this.currToken,
			this.currToken.literal,
			left,
		);
		const currPrecedence = this.currPrecedence();
		this.nextToken();
		expression.rightExpr = this.parseExpression(currPrecedence);
		return expression;
	};
	parseGroupedExpression = () => {
		this.nextToken();
		const expression = this.parseExpression(Precedences.LOWEST);
		if (!this.expectPeek(TokenType.RPAREN)) {
			return null;
		}
		return expression;
	};
	parseIfExpression = () => {
		const expression = new IfExpression(this.currToken);
		if (!this.expectPeek(TokenType.LPAREN)) {
			return null;
		}
		this.nextToken();
		expression.condition = this.parseExpression(Precedences.LOWEST);
		if (!this.expectPeek(TokenType.RPAREN)) return null;
		if (!this.expectPeek(TokenType.LBRACE)) return null;
		expression.consequence = this.parseBlockStatement();
		if (this.peekTokenIs(TokenType.ELSE)) {
			this.nextToken();
			if (!this.expectPeek(TokenType.LBRACE)) return null;
			expression.alternative = this.parseBlockStatement();
		}
		return expression;
	};
	parseFunctionLiteral = () => {
		const expression = new FunctionLiteral(this.currToken);
		if (!this.expectPeek(TokenType.LPAREN)) return null;

		expression.parameters = this.parseFnParameters();

		if (!this.expectPeek(TokenType.LBRACE)) return null;
		expression.body = this.parseBlockStatement();

		return expression;
	};
	parseFnParameters() {
		const parameters: Identifier[] = [];
		if (this.peekTokenIs(TokenType.RPAREN)) {
			this.nextToken();
			return parameters;
		}
		this.nextToken();
		const param = new Identifier(this.currToken, this.currToken.literal);
		parameters.push(param);
		while (this.peekTokenIs(TokenType.COMMA)) {
			this.nextToken();
			this.nextToken();
			parameters.push(new Identifier(this.currToken, this.currToken.literal));
		}
		if (!this.expectPeek(TokenType.RPAREN)) return null;
		return parameters;
	}
	parseCallExpression = (func: Expression) => {
		return new CallExpression(this.currToken, func, this.parseCallArgs());
	};
	parseCallArgs = () => {
		const args: Expression[] = [];
		if (this.peekTokenIs(TokenType.RPAREN)) {
			this.nextToken();
			return args;
		}
		this.nextToken();
		args.push(this.parseExpression(Precedences.LOWEST)!);

		while (this.peekTokenIs(TokenType.COMMA)) {
			this.nextToken();
			this.nextToken();
			args.push(this.parseExpression(Precedences.LOWEST)!);
		}
		if (!this.expectPeek(TokenType.RPAREN)) return null;
		return args;
	};
	parseBlockStatement() {
		const block = new BlockStatement(this.currToken);
		this.nextToken();
		while (
			!this.currTokenIs(TokenType.RBRACE) &&
			!this.currTokenIs(TokenType.EOF)
		) {
			const statement = this.parseStatement();
			if (statement) {
				block.statements.push(statement);
			}
			this.nextToken();
		}

		return block;
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
	registerPrefix = (type: TokenType, fn: PrefixParseFn) => {
		this.prefixParseFnsMap[type] = fn;
	};
	registerInfix(type: TokenType, fn: InfixParseFn) {
		this.infixParseFnsMap[type] = fn;
	}

	peekError(type: TokenType) {
		const msg = `expected next token to be ${type}, got ${this.peekToken.type}`;
		this.errors.push(msg);
	}
	peekPrecedence() {
		return this.precedencesMap[this.peekToken.type] || Precedences.LOWEST;
	}
	currPrecedence() {
		return this.precedencesMap[this.currToken.type] || Precedences.LOWEST;
	}
	// auto bind this
	parseIdentifier = () => {
		return new Identifier(this.currToken, this.currToken.literal);
	};
}
