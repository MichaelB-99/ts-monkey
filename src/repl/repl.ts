import { parseArgs } from "node:util";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
export async function repl() {
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			ast: {
				type: "boolean",
				default: false,
			},
		},
		allowPositionals: true,
	});
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
		if (values.ast) {
			console.log(program.statements);
		}
		prompt();
	}
}
const printParserErrors = (errors: string[]) => {
	console.log(MONKEY_FACE);
	console.log("woops! we ran into some monkey business here!");
	console.log("parser errors:");
	errors.forEach((e) => console.log(e));
};
const prompt = () => console.log(">>");

const MONKEY_FACE = `
            __,__
   .--.  .-"     "-.  .--.
  / .. \\/  .-. .-.  \\/ .. \\
 | |  '|  /   Y   \\  |'  | |
 | \\   \\  \\ 0 | 0 /  /   / |
  \\ '- ,\\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\\ '-''
       |  \\._   _./  |
       \\   \\ '~' /   /
        '._ '-=-' _.'
           '-----'
`;
