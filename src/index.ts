import { userInfo } from "node:os";
import { Glob } from "bun";
import { Environment } from "./eval/environment";
import { evaluate } from "./eval/eval";
import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { repl } from "./repl/repl";
(async () => {
	if (Bun.argv.includes("--repl")) {
		Bun.argv.splice(Bun.argv.indexOf("--repl"), 1);
		console.log(
			`Hello, ${userInfo().username}! This is the monkey programming language`,
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
			.then((res) =>
				console.log(
					file,
					evaluate(
						new Parser(new Lexer(res)).parseProgram(),
						new Environment(),
					)?.inspect(),
				),
			);
	}
}
