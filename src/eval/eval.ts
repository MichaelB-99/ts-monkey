import {
	BlockStatement,
	BooleanLiteral,
	ExpressionStatement,
	IfExpression,
	InfixExpression,
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
import { TokenType } from "../token/token";
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
	if (node instanceof InfixExpression) {
		const left = evaluate(node.leftExpr);
		const right = evaluate(node.rightExpr);
		return evaluateInfixExpression(left, node.operator, right);
	}
	if (node instanceof BlockStatement) {
		return evalStatements(node.statements);
	}

	if (node instanceof IfExpression) {
		return evalIfExpression(node);
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

const evaluateInfixExpression = (
	left: Maybe<InternalObject>,
	operator: string,
	right: Maybe<InternalObject>,
) => {
	if (
		left?.type() === ObjectType.INTEGER_OBJ &&
		right?.type() === ObjectType.INTEGER_OBJ
	) {
		return evalIntegerInfixExpression(left, operator, right);
	}
	if (operator === TokenType.EQ) {
		return nativeBoolToBooleanObject(left === right);
	}
	if (operator === TokenType.NOT_EQ) {
		return nativeBoolToBooleanObject(left !== right);
	}
	return NULL_OBJ;
};

const nativeBoolToBooleanObject = (bool: boolean) => {
	return bool ? TRUE_OBJ : FALSE_OBJ;
};
const evalIntegerInfixExpression = (
	left: Maybe<InternalObject>,
	operator: string,
	right: Maybe<InternalObject>,
) => {
	const leftValue = (left as IntegerObject).value;
	const rightValue = (right as IntegerObject).value;
	switch (operator) {
		case "+":
			return new IntegerObject(leftValue + rightValue);

		case "-":
			return new IntegerObject(leftValue - rightValue);

		case "*":
			return new IntegerObject(leftValue * rightValue);

		case "/":
			return new IntegerObject(leftValue / rightValue);

		case "<":
			return nativeBoolToBooleanObject(leftValue < rightValue);
		case ">":
			return nativeBoolToBooleanObject(leftValue > rightValue);
		case "==":
			return nativeBoolToBooleanObject(leftValue === rightValue);
		case "!=":
			return nativeBoolToBooleanObject(leftValue !== rightValue);
		default:
			return NULL_OBJ;
	}
};

const evalIfExpression = (ifExpr: IfExpression) => {
	const condition = evaluate(ifExpr.condition);
	if (isTruthy(condition)) {
		return evaluate(ifExpr.consequence);
	}
	if (ifExpr.alternative) {
		return evaluate(ifExpr.alternative);
	}
	return NULL_OBJ;
};
const isTruthy = (obj: Maybe<InternalObject>) => {
	switch (obj) {
		case NULL_OBJ:
			return false;

		case TRUE_OBJ:
			return true;

		case FALSE_OBJ:
			return false;

		default:
			return true;
	}
};
