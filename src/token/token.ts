export enum TokenType {
	ILLEGAL = "ILLEGAL",
	EOF = "EOF",

	// identifiers & literals
	IDENT = "IDENT",
	INT = "INT",
	STRING = "STRING",

	//operators
	ASSIGN = "=",
	PLUS = "+",
	MINUS = "-",
	BANG = "!",
	ASTERISK = "*",
	SLASH = "/",
	LT = "<",
	LTE = "<=",
	GT = ">",
	GTE = ">=",
	EQ = "==",
	NOT_EQ = "!=",
	OR = "||",
	AND = "&&",

	//delimiters
	COMMA = ",",
	SEMICOLON = ";",
	COLON = ":",
	LPAREN = "(",
	RPAREN = ")",
	LBRACE = "{",
	RBRACE = "}",
	LBRACKET = "[",
	RBRACKET = "]",

	//keywords
	LET = "LET",
	FUNCTION = "FUNCTION",
	TRUE = "TRUE",
	FALSE = "FALSE",
	IF = "IF",
	ELSE = "ELSE",
	RETURN = "RETURN",
}
const keywordMap: Record<string, TokenType> = {
	fn: TokenType.FUNCTION,
	let: TokenType.LET,
	if: TokenType.IF,
	else: TokenType.ELSE,
	true: TokenType.TRUE,
	false: TokenType.FALSE,
	return: TokenType.RETURN,
};

export function lookupIdentifier(identifer: string) {
	if (keywordMap[identifer]) {
		return keywordMap[identifer];
	}
	return TokenType.IDENT;
}

export type Token = {
	type: TokenType;
	literal: string;
};
