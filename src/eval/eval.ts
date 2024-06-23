import {
	BooleanLiteral,
	ExpressionStatement,
	IntegerLiteral,
	type Node,
	PrefixExpression,
	Program,
	type Statement,
} from "../ast/ast";
import {
	FALSE_OBJ,
	IntegerObject,
	type InternalObject,
	NULL_OBJ,
	ObjectType,
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
	if (node instanceof PrefixExpression) {
		const right = evaluate(node.rightExpression);
		const expr = evaluatePrefixExpression(node.operator, right);
		return expr;
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

const evaluatePrefixExpression = (
	operator: string,
	right: Maybe<InternalObject>,
) => {
	switch (operator) {
		case "!":
			return evalBangOperatorExpression(right);
		case "-":
			return evalMinusOperatorExpression(right);
		default:
			return NULL_OBJ;
	}
};
const evalBangOperatorExpression = (right: Maybe<InternalObject>) => {
	switch (right) {
		case TRUE_OBJ:
			return FALSE_OBJ;

		case FALSE_OBJ:
			return TRUE_OBJ;

		case NULL_OBJ:
			return TRUE_OBJ;

		default:
			return FALSE_OBJ;
	}
};

const evalMinusOperatorExpression = (right: Maybe<InternalObject>) => {
	if (right?.type() !== ObjectType.INTEGER_OBJ) return NULL_OBJ;
	const value = (right as IntegerObject).value;
	return new IntegerObject(-value);
};
