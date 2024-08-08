import { type Instructions, OpCodes, readUint16 } from "../code/code";
import type { Bytecode } from "../compiler/compiler";
import {
	FALSE_OBJ,
	IntegerObject,
	type InternalObject,
	TRUE_OBJ,
} from "../object/object";
import type { Maybe } from "../utils/types";

const STACK_SIZE = 2048;
export class VM {
	constructor(
		private instructions: Instructions,
		private bytecode: Bytecode,
	) {}
	public stack: Maybe<InternalObject>[] = [];
	public lastPoppedStackElement: Maybe<InternalObject>;
	public stackPointer = 0;
	run() {
		for (let i = 0; i < this.instructions.length; i++) {
			const op: OpCodes = this.instructions[i];
			switch (op) {
				case OpCodes.OpConstant: {
					const constIndex = readUint16(this.instructions.slice(i + 1));
					i += 2;
					this.push(this.bytecode.constants.at(constIndex));
					break;
				}

				case OpCodes.OpTrue:
					this.push(TRUE_OBJ);
					break;
				case OpCodes.OpFalse:
					this.push(FALSE_OBJ);
					break;
				case OpCodes.OpSub:
				case OpCodes.OpMult:
				case OpCodes.OpDiv:
				case OpCodes.OpAdd: {
					this.doBinaryOp(op);
					break;
				}
				case OpCodes.OpPop:
					this.pop();
					break;
				default:
					break;
			}
		}
	}

	lastPoppedElement() {
		return this.stack[this.stackPointer];
	}

	push(obj: Maybe<InternalObject>) {
		if (this.stackPointer >= STACK_SIZE) {
			throw new Error("Stack overflow");
		}
		this.stack[this.stackPointer] = obj;
		this.stackPointer++;
	}
	pop() {
		const obj = this.stack[this.stackPointer - 1];
		this.stackPointer--;
		return obj;
	}
	doBinaryOp(op: OpCodes) {
		const n2 = this.pop();
		const n1 = this.pop();
		if (n1 instanceof IntegerObject && n2 instanceof IntegerObject) {
			this.doIntegerBinaryOp(n1, op, n2);
		}
	}
	doIntegerBinaryOp(n1: IntegerObject, op: OpCodes, n2: IntegerObject) {
		switch (op) {
			case OpCodes.OpAdd:
				return this.push(new IntegerObject(n1.value + n2.value));
			case OpCodes.OpMult:
				return this.push(new IntegerObject(n1.value * n2.value));
			case OpCodes.OpDiv:
				return this.push(new IntegerObject(n1.value / n2.value));
			case OpCodes.OpSub:
				return this.push(new IntegerObject(n1.value - n2.value));

			default:
				break;
		}
	}
}
