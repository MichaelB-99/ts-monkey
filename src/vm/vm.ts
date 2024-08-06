import { type Instructions, OpCodes, readUint16 } from "../code/code";
import type { Bytecode } from "../compiler/compiler";
import type { InternalObject } from "../object/object";
import type { Maybe } from "../utils/types";

const STACK_SIZE = 2048;
export class VM {
	constructor(
		private instructions: Instructions,
		private bytecode: Bytecode,
	) {}
	public stack: Maybe<InternalObject>[] = [];
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

				default:
					break;
			}
		}
	}

	stackTop() {
		return this.stack.at(-1);
	}

	get stackPointer() {
		return this.stack.length;
	}
	push(obj: Maybe<InternalObject>) {
		if (this.stackPointer >= STACK_SIZE) {
			throw new Error("Stack overflow");
		}
		this.stack.push(obj);
	}
}
