import { userInfo } from "node:os";
import { Glob } from "bun";
import { stringify } from "./code/code";
import { Compiler } from "./compiler/compiler";
import { Environment } from "./eval/environment";
import { evaluate } from "./eval/eval";
import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { repl } from "./repl/repl";
import { VM } from "./vm/vm";
(async () => {
	if (Bun.argv.includes("--repl")) {
		Bun.argv.splice(Bun.argv.indexOf("--repl"), 1);
		console.log(
			`Hello, ${userInfo().username}! This is the monkey programming language.`,
		);
		console.log(
			`Monkey is running in ${Bun.argv.includes("-c") ? "vm" : "interpreter"} mode.`,
		);
		console.log("Feel free to type in commands");
		repl();
	} else {
		runFiles();
	}
})();

async function runFiles() {
	const glob = new Glob("**/*.mo");
	for await (const file of glob.scan()) {
		Bun.file(file)
			.text()
			.then((res) => {
				const parser = new Parser(new Lexer(res));
				const program = parser.parseProgram();
				if (parser.errors.length) {
					parser.errors.forEach((e) => console.log(e));
					return;
				}
				const printAST = Bun.argv.includes("--ast");
				const printOps = Bun.argv.includes("--bytecode");
				if (Bun.argv.includes("-c")) {
					const compiler = new Compiler();
					compiler.compile(program);
					const vm = new VM(compiler.bytecode());
					vm.run();
					if (printOps) {
						console.log(stringify(compiler.bytecode().instructions));
					}
					console.log(vm.lastPoppedElement()?.inspect());
				} else {
					console.log(file, evaluate(program, new Environment())?.inspect());
				}
				if (printAST) console.log(program);
			});
	}
}
