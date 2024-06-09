import { userInfo } from "node:os";
import { repl } from "./repl/repl";
(async () => {
	console.log(
		`Hello, ${userInfo().username}! This is the monkey programming language`,
	);
	console.log("Feel free to type in commands");
	repl();
})();
