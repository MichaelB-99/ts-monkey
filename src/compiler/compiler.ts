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
} from "../ast/ast";
import { type Instructions, OpCodes, make } from "../code/code";
import { IntegerObject, type InternalObject } from "../object/object";
import type { Maybe } from "../utils/types";

export class Compiler {
	public instructions: Instructions = new Uint8Array();
	public constants: Maybe<InternalObject>[] = [];
	public previousInstruction: Maybe<EmittedInstruction>;
	lastInstruction: Maybe<EmittedInstruction>;

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
		if (node instanceof BooleanLiteral) {
			if (node.value) {
				this.emit(OpCodes.OpTrue);
			} else {
				this.emit(OpCodes.OpFalse);
			}
		}
		if (node instanceof InfixExpression) {
			if (node.operator === "<") {
				this.compile(node.rightExpr);
				this.compile(node.leftExpr);
				this.emit(OpCodes.OpGreaterThan);
				return null;
			}
			if (node.operator === "<=") {
				this.compile(node.rightExpr);
				this.compile(node.leftExpr);
				this.emit(OpCodes.OpGreaterThanOrEqual);
				return null;
			}
			this.compile(node.leftExpr);
			this.compile(node.rightExpr);
			switch (node.operator) {
				case "+":
					this.emit(OpCodes.OpAdd);
					break;

				case "-":
					this.emit(OpCodes.OpSub);
					break;

				case "*":
					this.emit(OpCodes.OpMult);
					break;
				case "/":
					this.emit(OpCodes.OpDiv);
					break;

				case "==":
					this.emit(OpCodes.OpEqual);
					break;

				case "!=":
					this.emit(OpCodes.OpNotEqual);
					break;

				case ">":
					this.emit(OpCodes.OpGreaterThan);
					break;
				case ">=":
					this.emit(OpCodes.OpGreaterThanOrEqual);
					break;
				default:
					break;
			}
		}
		if (node instanceof IfExpression) {
			this.compile(node.condition);
			const jumpNotTruthyPos = this.emit(OpCodes.OpJumpNotTruthy, 9999);
			this.compile(node.consequence);

			if (this.lastInstruction?.opcode === OpCodes.OpPop) {
				this.removeLastPop();
			}

			const jumpPos = this.emit(OpCodes.OpJump, 9999);
			const afterConsequencePos = this.instructions.length;
			this.changeOperand(jumpNotTruthyPos, afterConsequencePos);

			if (!node.alternative) {
				this.emit(OpCodes.OpNull);
			} else {
				this.compile(node.alternative);
				if (this.lastInstruction?.opcode === OpCodes.OpPop) {
					this.removeLastPop();
				}
			}

			const afterAlternativePos = this.instructions.length;
			this.changeOperand(jumpPos, afterAlternativePos);
		}
		if (node instanceof BlockStatement) {
			for (const statement of node.statements) {
				this.compile(statement);
			}
		}
		if (node instanceof PrefixExpression) {
			this.compile(node.rightExpression);
			switch (node.operator) {
				case "!":
					this.emit(OpCodes.OpBang);
					break;
				case "-":
					this.emit(OpCodes.OpMinus);
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
		this.setLastInstruction(op, pos);
		return pos;
	}
	setLastInstruction(op: OpCodes, pos: number) {
		const prev = this.lastInstruction;
		this.lastInstruction = { opcode: op, pos };
		this.previousInstruction = prev;
	}
	removeLastPop() {
		this.instructions = this.instructions.slice(0, this.lastInstruction?.pos);
		this.lastInstruction = this.previousInstruction;
	}
	replaceInstruction(pos: number, newInstruction: Uint8Array) {
		for (let i = 0; i < newInstruction.length; i++) {
			this.instructions[pos + i] = newInstruction[i];
		}
	}
	changeOperand(opPos: number, operand: number) {
		const newInstruction = make(this.instructions[opPos], operand);
		this.replaceInstruction(opPos, newInstruction);
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

type EmittedInstruction = {
	opcode: OpCodes;
	pos: number;
};
