import { Lexer } from "../lexer/lexer";
import { TokenType } from "../token/token";
export async function repl() {
	prompt();
	for await (const line of console) {
		const lexer = new Lexer(line);
		for (
			let token = lexer.nextToken();
			token.type !== TokenType.EOF;
			token = lexer.nextToken()
		) {
			console.log(token);
		}
		prompt();
	}
}
const prompt = () => console.log(">>");
