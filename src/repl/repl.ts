import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
export async function repl() {
	prompt();
	for await (const line of console) {
		const lexer = new Lexer(line);
		const parser = new Parser(lexer);
		const program = parser.parseProgram();
		if (parser.errors.length) {
			printParserErrors(parser.errors);
			continue;
		}
		console.log(program.string());
		prompt();
	}
}
const printParserErrors = (errors: string[]) => {
	errors.forEach((e) => console.log(e));
};
const prompt = () => console.log(">>");
