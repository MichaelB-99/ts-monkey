export enum TokenType {
	ILLEGAL = "ILLEGAL",
	EOF = "EOF",

	// identifiers & literals
	IDENT = "IDENT",
	INT = "INT",

	//operators
	ASSIGN = "=",
	PLUS = "+",

	//delimiters
	COMMA = ",",
	SEMICOLON = ";",
	LPAREN = "(",
	RPAREN = ")",
	LBRACE = "{",
	RBRACE = "}",

	//keywords
	LET = "LET",
	FUNCTION = "FUNCTION",
}
const keywordMap: Record<string, TokenType> = {
	fn: TokenType.FUNCTION,
	let: TokenType.LET,
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
