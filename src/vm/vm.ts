import { type Instructions, OpCodes, readUint16 } from "../code/code";
import type { Bytecode } from "../compiler/compiler";
import {
	BooleanObject,
	FALSE_OBJ,
	IntegerObject,
	type InternalObject,
	NULL_OBJ,
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
				case OpCodes.OpJump: {
					const jumpTo = readUint16(this.instructions.slice(i + 1));
					i = jumpTo - 1;

					break;
				}

				case OpCodes.OpJumpNotTruthy: {
					const jumpTo = readUint16(this.instructions.slice(i + 1));
					i += 2;
					const cond = this.pop();
					if (!this.isTruthy(cond)) {
						i = jumpTo - 1;
					}
					break;
				}
				case OpCodes.OpNull: {
					this.push(NULL_OBJ);
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
				case OpCodes.OpNotEqual:
				case OpCodes.OpGreaterThan:
				case OpCodes.OpGreaterThanOrEqual:
				case OpCodes.OpEqual:
					this.executeComparison(op);
					break;

				case OpCodes.OpBang:
					this.executeBangOperator();
					break;
				case OpCodes.OpMinus:
					this.executeMinusOperator();
					break;

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
	executeComparison(op: OpCodes) {
		const right = this.pop();
		const left = this.pop();

		if (left instanceof IntegerObject && right instanceof IntegerObject) {
			return this.executeIntegerComparison(left, op, right);
		}
		// TODO string comparison
		switch (op) {
			case OpCodes.OpEqual:
				this.push(this.nativeBoolToBooleanObject(left === right));
				break;
			case OpCodes.OpNotEqual:
				this.push(this.nativeBoolToBooleanObject(left !== right));
				break;

			default:
				throw new Error(
					`unknown operator ${op}, ${left?.type()}, ${right?.type()}`,
				);
		}
	}
	executeIntegerComparison(
		left: IntegerObject,
		op: OpCodes,
		right: IntegerObject,
	) {
		switch (op) {
			case OpCodes.OpEqual:
				return this.push(
					this.nativeBoolToBooleanObject(left.value === right.value),
				);
			case OpCodes.OpNotEqual:
				return this.push(
					this.nativeBoolToBooleanObject(left.value !== right.value),
				);
			case OpCodes.OpGreaterThan:
				return this.push(
					this.nativeBoolToBooleanObject(left.value > right.value),
				);
			case OpCodes.OpGreaterThanOrEqual:
				return this.push(
					this.nativeBoolToBooleanObject(left.value >= right.value),
				);

			default:
				throw new Error(`unknown operator ${op}`);
		}
	}
	executeBangOperator() {
		const val = this.pop();
		switch (val) {
			case TRUE_OBJ:
				return this.push(FALSE_OBJ);

			case FALSE_OBJ:
				return this.push(TRUE_OBJ);

			case NULL_OBJ:
				return this.push(TRUE_OBJ);

			default:
				return this.push(FALSE_OBJ);
		}
	}
	executeMinusOperator() {
		const val = this.pop();
		if (!(val instanceof IntegerObject)) {
			throw new Error("TypeError: unsupported type for negation");
		}
		this.push(new IntegerObject(-val.value));
	}
	isTruthy(obj: Maybe<InternalObject>) {
		if (obj instanceof BooleanObject) {
			return obj.value;
		}
		if (obj === NULL_OBJ) return false;
		return true;
	}
	nativeBoolToBooleanObject = (bool: boolean) => {
		return bool ? TRUE_OBJ : FALSE_OBJ;
	};
}
