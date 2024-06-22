import {
	BooleanLiteral,
	ExpressionStatement,
	IntegerLiteral,
	type Node,
	Program,
	type Statement,
} from "../ast/ast";
import {
	FALSE_OBJ,
	IntegerObject,
	type InternalObject,
	TRUE_OBJ,
} from "../object/object";
import type { Maybe } from "../utils/types";

export function evaluate(node: Maybe<Node>): Maybe<InternalObject> {
	if (node instanceof IntegerLiteral) {
		return new IntegerObject(node.value!);
	}
	if (node instanceof Program) {
		return evalStatements(node.statements);
	}
	if (node instanceof ExpressionStatement) {
		return evaluate(node.expression);
	}
	if (node instanceof BooleanLiteral) {
		return node.value ? TRUE_OBJ : FALSE_OBJ;
	}
	return null;
}

const evalStatements = (statements: Statement[]) => {
	let result: InternalObject | null = null;
	for (const statement of statements) {
		result = evaluate(statement);
	}
	return result;
};
