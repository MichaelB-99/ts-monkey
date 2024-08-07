import {
	ExpressionStatement,
	InfixExpression,
	IntegerLiteral,
	type Node,
	Program,
} from "../ast/ast";
import { type Instructions, OpCodes, make } from "../code/code";
import { IntegerObject, type InternalObject } from "../object/object";
import type { Maybe } from "../utils/types";

export class Compiler {
	public instructions: Instructions = new Uint8Array();
	public constants: Maybe<InternalObject>[] = [];

	compile(node: Maybe<Node>) {
		if (node instanceof Program) {
			for (const statement of node.statements) {
				this.compile(statement);
			}
		}
		if (node instanceof ExpressionStatement) {
			this.compile(node.expression);
			this.emit(OpCodes.OpPop);
		}
		if (node instanceof InfixExpression) {
			this.compile(node.leftExpr);
			this.compile(node.rightExpr);
			switch (node.operator) {
				case "+":
					this.emit(OpCodes.OpAdd);
					break;

				default:
					break;
			}
		}
		if (node instanceof IntegerLiteral) {
			const integer = new IntegerObject(node.value!);
			this.emit(OpCodes.OpConstant, this.addConstant(integer));
		}

		return null;
	}
	addConstant(obj: Maybe<InternalObject>) {
		this.constants.push(obj);
		return this.constants.length - 1;
	}
	emit(op: OpCodes, ...operands: number[]) {
		const instruction = make(op, ...operands);
		const pos = this.addInstruction(instruction);
		return pos;
	}
	addInstruction(ins: Uint8Array) {
		const pos = this.instructions.length;
		const newArr = new Uint8Array(this.instructions.length + ins.length);
		newArr.set(this.instructions);
		newArr.set(ins, this.instructions.length);
		this.instructions = newArr;
		return pos;
	}
	bytecode() {
		return new Bytecode(this.instructions, this.constants);
	}
}

export class Bytecode {
	constructor(
		public instructions: Instructions,
		public constants: Maybe<InternalObject>[],
	) {}
}
