import { type Token, TokenType, lookupIdentifier } from "../token/token";

type Char = string | 0;
export class Lexer {
	//current position in input
	private position = 0;
	// always the next position
	private readPosition = 0;
	private ch: Char = "";
	constructor(public input: string) {
		this.readChar();
	}
	readChar() {
		// if we reach the end of input
		if (this.readPosition >= this.input.length) {
			this.ch = 0;
		}
		// otherwise keep going
		else {
			// update char
			this.ch = this.input[this.readPosition];
		}
		// update position count
		this.position = this.readPosition;
		//update readPosition
		this.readPosition += 1;
	}
	nextToken(): Token {
		let token: Token;
		this.skipWhitespace();
		if (this.isComment) {
			this.skipComment();
			// return and call next token again in case there are multiple consecutive comments.
			// otherwise we'd only skip the first comment and end up lexing comment characters thinking they are part of monkey code
			return this.nextToken();
		}
		switch (this.ch) {
			case "=":
				if (this.peekChar() === "=") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.EQ, currChar + this.ch);
				} else if (this.peekChar() === ">") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.ARROW, currChar + this.ch);
				} else {
					token = this.newToken(TokenType.ASSIGN, this.ch);
				}
				break;

			case "(":
				token = this.newToken(TokenType.LPAREN, this.ch);
				break;

			case ")":
				token = this.newToken(TokenType.RPAREN, this.ch);
				break;

			case "{":
				token = this.newToken(TokenType.LBRACE, this.ch);
				break;
			case "}":
				token = this.newToken(TokenType.RBRACE, this.ch);
				break;
			case ",":
				token = this.newToken(TokenType.COMMA, this.ch);
				break;
			case "+":
				token = this.newToken(TokenType.PLUS, this.ch);
				break;
			case ";":
				token = this.newToken(TokenType.SEMICOLON, this.ch);
				break;

			case "-":
				token = this.newToken(TokenType.MINUS, this.ch);
				break;
			case "!":
				if (this.peekChar() === "=") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.NOT_EQ, currChar + this.ch);
				} else {
					token = this.newToken(TokenType.BANG, this.ch);
				}
				break;

			case "*":
				token = this.newToken(TokenType.ASTERISK, this.ch);
				break;

			case "/":
				token = this.newToken(TokenType.SLASH, this.ch);
				break;

			case "<":
				if (this.peekChar() === "=") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.LTE, currChar + this.ch);
				} else {
					token = this.newToken(TokenType.LT, this.ch);
				}
				break;
			case ">":
				if (this.peekChar() === "=") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.GTE, currChar + this.ch);
				} else {
					token = this.newToken(TokenType.GT, this.ch);
				}
				break;

			case '"':
				token = this.newToken(TokenType.STRING, this.readString());
				break;

			case "|":
				if (this.peekChar() === "|") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.OR, currChar + this.ch);
				} else {
					token = this.newToken(TokenType.ILLEGAL, this.ch);
				}
				break;
			case "&":
				if (this.peekChar() === "&") {
					const currChar = this.ch;
					this.readChar();
					token = this.newToken(TokenType.AND, currChar + this.ch);
				} else {
					token = this.newToken(TokenType.ILLEGAL, this.ch);
				}
				break;

			case "[":
				token = this.newToken(TokenType.LBRACKET, this.ch);
				break;

			case "]":
				token = this.newToken(TokenType.RBRACKET, this.ch);
				break;

			case ":":
				token = this.newToken(TokenType.COLON, ":");
				break;
			case 0: {
				token = this.newToken(TokenType.EOF, "");
				break;
			}

			default:
				if (this.isLetter(this.ch)) {
					const literal = this.readIdentifier();
					return this.newToken(lookupIdentifier(literal), literal);
				}
				if (this.isDigit(this.ch)) {
					const number = this.readNumber();
					return this.newToken(TokenType.INT, number);
				}
				token = this.newToken(TokenType.ILLEGAL, this.ch);
		}
		this.readChar();
		return token;
	}
	newToken(type: TokenType, literal: string): Token {
		return {
			type,
			literal,
		};
	}

	readIdentifier() {
		const currPos = this.position;
		while (this.isLetter(this.ch) || this.isDigit(this.ch)) {
			this.readChar();
		}
		return this.input.slice(currPos, this.position);
	}
	isLetter(ch: Char) {
		return (
			(ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || this.ch === "_"
		);
	}

	readNumber() {
		const currPos = this.position;
		while (this.isDigit(this.ch)) {
			this.readChar();
		}
		return this.input.slice(currPos, this.position);
	}

	skipWhitespace() {
		while (
			this.ch === " " ||
			this.ch === "\t" ||
			this.ch === "\n" ||
			this.ch === "\r"
		) {
			this.readChar();
		}
	}

	isDigit(ch: Char) {
		// gotta love js type coercion.. it will coerce 0 (eof) to a string
		return ch !== 0 && ch >= "0" && ch <= "9";
	}

	peekChar() {
		if (this.readPosition >= this.input.length) return 0;
		return this.input[this.readPosition];
	}
	readString() {
		this.readChar();
		const position = this.position;
		while (this.ch !== '"' && this.ch !== 0) {
			this.readChar();
		}
		return this.input.slice(position, this.position);
	}
	skipComment() {
		if (this.ch === "/" && this.peekChar() === "*") {
			this.skipMultilineComment();
		} else {
			this.skipSingleLineComment();
		}
	}
	skipSingleLineComment() {
		while (this.ch !== "\n") {
			this.readChar();
		}
	}

	skipMultilineComment() {
		let found = false;
		while (!found) {
			if (this.ch === "*" && this.peekChar() === "/") {
				found = true;
				break;
			}
			this.readChar();
		}
		// skip past the end of comment characters (*/) so we don't end up lexing them
		this.readChar();
		this.readChar();
	}
	get isComment() {
		return (
			(this.ch === "/" && this.peekChar() === "/") ||
			(this.ch === "/" && this.peekChar() === "*")
		);
	}
}
