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

export type Token = {
	type: TokenType;
	literal: string;
};
