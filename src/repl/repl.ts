import { parseArgs } from "node:util";
import { Compiler } from "../compiler/compiler";
import { Environment } from "../eval/environment";
import { evaluate } from "../eval/eval";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { VM } from "../vm/vm";
export async function repl() {
	const env = new Environment();
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			ast: {
				type: "boolean",
				default: false,
			},
			compiler: {
				type: "boolean",
				default: false,
				short: "c",
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

		if (values.compiler) {
			const compiler = new Compiler();
			compiler.compile(program);
			const vm = new VM(compiler.instructions, compiler.bytecode());
			vm.run();
			console.log(vm.lastPoppedElement()?.inspect());
		} else {
			const evaluated = evaluate(program, env);
			if (evaluated) {
				console.log(evaluated.inspect());
			}
		}

		if (values.ast) {
			console.log(program.statements[0]);
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
const prompt = () => process.stdout.write(">> ");

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
