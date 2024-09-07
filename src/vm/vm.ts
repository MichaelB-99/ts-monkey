import {
	type Instructions,
	OpCodes,
	definitionsMap,
	readUint8,
	readUint16,
} from "../code/code";
import type { Bytecode } from "../compiler/compiler";
import { builtins } from "../object/builtins";
import {
	ArrayObject,
	BooleanObject,
	BuiltInObject,
	ClosureObject,
	CompiledFunctionObject,
	ErrorObject,
	FALSE_OBJ,
	HashObject,
	IntegerObject,
	type InternalObject,
	NULL_OBJ,
	StringObject,
	TRUE_OBJ,
} from "../object/object";
import type { Maybe } from "../utils/types";
import { Frame } from "./frame";

const STACK_SIZE = 2048;
export class VM {
	constructor(
		private bytecode: Bytecode,
		private globals: Maybe<InternalObject>[] = [],
	) {
		const mainFn = new CompiledFunctionObject(this.bytecode.instructions, 0, 0);
		const mainClosure = new ClosureObject(mainFn, []);
		const mainFrame = new Frame(mainClosure, 0);
		this.frames[0] = mainFrame;
	}
	private stack: Maybe<InternalObject>[] = [];
	private stackPointer = 0;
	private frames: Frame[] = [];
	private framesIndex = 1;
	run() {
		let ip: number;
		let instructions: Instructions;
		let op: OpCodes;
		let frame = this.currentFrame;
		while (frame.ip < frame.instructions.length) {
			frame.ip++;
			instructions = frame.instructions;
			ip = frame.ip;
			op = frame.instructions[ip];
			switch (op) {
				case OpCodes.OpConstant: {
					const constIndex = readUint16(instructions, ip + 1);
					frame.ip += 2;
					this.push(this.bytecode.constants[constIndex]);
					break;
				}
				case OpCodes.OpClosure: {
					const constIndex = readUint16(instructions, ip + 1);
					const free = readUint8(instructions, ip + 3);
					frame.ip += 3;
					this.pushClosure(constIndex, free);
					break;
				}

				case OpCodes.OpSetGlobal: {
					const globalIndex = readUint16(instructions, ip + 1);
					frame.ip += 2;
					const val = this.pop();
					this.globals[globalIndex] = val;
					break;
				}
				case OpCodes.OpGetGlobal: {
					const globalIndex = readUint16(instructions, ip + 1);
					frame.ip += 2;
					this.push(this.globals[globalIndex]);
					break;
				}
				case OpCodes.OpSetLocal: {
					const index = readUint8(instructions, ip + 1);
					frame.ip += 1;
					const val = this.pop();
					this.stack[frame.basePointer + index] = val;
					break;
				}
				case OpCodes.OpGetLocal: {
					const index = readUint8(instructions, ip + 1);
					frame.ip += 1;
					const val = this.stack[frame.basePointer + index];
					this.push(val);
					break;
				}

				case OpCodes.OpJump: {
					const jumpTo = readUint16(instructions, ip + 1);
					frame.ip = jumpTo - 1;

					break;
				}

				case OpCodes.OpJumpNotTruthy: {
					const jumpTo = readUint16(instructions, ip + 1);
					frame.ip += 2;
					const cond = this.pop();
					if (!this.isTruthy(cond)) {
						frame.ip = jumpTo - 1;
					}
					break;
				}
				case OpCodes.OpHash: {
					const num = readUint16(instructions, ip + 1);
					frame.ip += 2;
					const map = this.buildHash(num);
					// map won't exist if we encounter error building hash, we stop and push error onto the stack instead
					if (map) {
						this.push(new HashObject(map));
					}
					break;
				}
				case OpCodes.OpArray: {
					const num = readUint16(instructions, ip + 1);
					frame.ip += 2;
					const arr = [];
					for (let index = 0; index < num; index++) {
						arr.unshift(this.pop());
					}
					this.push(new ArrayObject(arr));
					break;
				}
				case OpCodes.OpIndex: {
					const idx = this.pop();
					const obj = this.pop();
					if (obj instanceof ArrayObject) {
						this.indexArray(obj, idx!);
					} else if (obj instanceof HashObject) {
						this.indexHash(obj, idx!);
					} else if (obj instanceof StringObject) {
						this.indexString(obj, idx);
					} else {
						this.push(new ErrorObject(`${obj?.type()} is not indexable`));
					}
					break;
				}
				case OpCodes.OpGetFree: {
					const index = readUint8(instructions, ip + 1);
					frame.ip += 1;
					const currentClosure = frame.closure;
					this.push(currentClosure.free[index]);
					break;
				}
				case OpCodes.OpCall: {
					const numArgs = readUint8(instructions, ip + 1);
					this.currentFrame.ip += 1;
					this.executeCall(numArgs);
					break;
				}
				case OpCodes.OpFor: {
					const index = readUint16(instructions, ip + 1);
					const numArgs = readUint8(instructions, ip + 3);
					const numFree = readUint8(instructions, ip + 4);
					frame.ip += 4;
					const fn = this.bytecode.constants[index];
					if (!(fn instanceof CompiledFunctionObject)) {
						throw new Error("");
					}
					const free = this.getFreeVariables(numFree);
					const arr = this.pop() as ArrayObject;
					if (!(arr instanceof ArrayObject)) {
						throw new Error("attempting to iterate over a non iterable");
					}

					const closure = new ClosureObject(fn, free);
					for (let i = arr.elements.length - 1; i >= 0; i--) {
						const element = arr.elements[i];
						this.push(element);
						if (numArgs === 2) {
							this.push(new IntegerObject(i));
						}
						this.callClosure(closure, numArgs);
					}
					break;
				}

				case OpCodes.OpReturnValue: {
					const returnVal = this.pop();
					const frame = this.popFrame();
					this.stackPointer = frame.basePointer - 1;
					this.push(returnVal);
					break;
				}
				case OpCodes.OpGetBuiltin: {
					const index = readUint8(instructions, ip + 1);
					this.currentFrame.ip += 1;
					this.push(builtins[index]!.builtin);
					break;
				}
				case OpCodes.OpPopFrame: {
					const frame = this.popFrame();

					this.stackPointer = frame.basePointer;
					break;
				}
				case OpCodes.OpReturn: {
					const frame = this.popFrame();
					this.stackPointer = frame.basePointer - 1;
					this.push(NULL_OBJ);
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
				case OpCodes.OpOr:
				case OpCodes.OpAnd:
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
			if (frame !== this.currentFrame) {
				frame = this.currentFrame;
			}
		}
	}
	private pushClosure(constIndex: number, numFree: number) {
		const fn = this.bytecode.constants[constIndex];
		if (!(fn instanceof CompiledFunctionObject)) {
			throw new Error("");
		}

		const free = this.getFreeVariables(numFree);
		const closure = new ClosureObject(fn, free);
		return this.push(closure);
	}
	private executeCall(numArgs: number) {
		const fn = this.stack[this.stackPointer - numArgs - 1];
		if (fn instanceof ClosureObject) {
			return this.callClosure(fn, numArgs);
		}
		if (fn instanceof BuiltInObject) {
			return this.callBuiltin(fn, numArgs);
		}
		return this.push(new ErrorObject("calling non function"));
	}
	private callClosure(closure: ClosureObject, numArgs: number) {
		if (closure.fn.numParams !== numArgs) {
			return this.push(
				new ErrorObject(
					`wrong number of arguments. wanted=${closure.fn.numParams}, got=${numArgs}`,
				),
			);
		}
		this.pushFrame(new Frame(closure, this.stackPointer - numArgs));
		this.stackPointer = this.currentFrame.basePointer + closure.fn.numLocals;
	}
	private callBuiltin(fn: BuiltInObject, numArgs: number) {
		const args = this.stack.slice(
			this.stackPointer - numArgs,
			this.stackPointer,
		);
		const res = fn.fn({
			env: "vm",
			bytecode: this.bytecode,
			globals: this.globals,
			args,
		});
		this.stackPointer = this.stackPointer - numArgs - 1;
		this.push(res);
	}
	private indexString(indexee: StringObject, idx: Maybe<InternalObject>) {
		if (!(idx instanceof IntegerObject)) {
			return this.push(
				new ErrorObject(`${idx?.type()} cannot be used to index string`),
			);
		}
		const val = indexee.value.at(idx.value);
		if (!val) {
			return this.push(NULL_OBJ);
		}
		return this.push(new StringObject(val));
	}

	lastPoppedElement() {
		return this.stack[this.stackPointer];
	}

	private push(obj: Maybe<InternalObject>) {
		if (this.stackPointer >= STACK_SIZE) {
			throw new Error("Stack overflow");
		}
		this.stack[this.stackPointer] = obj;
		this.stackPointer++;
	}
	private pop() {
		const obj = this.stack[this.stackPointer - 1];
		this.stackPointer--;
		return obj;
	}
	private doBinaryOp(op: OpCodes) {
		const n2 = this.pop();
		const n1 = this.pop();
		if (n1 instanceof IntegerObject && n2 instanceof IntegerObject) {
			this.doIntegerBinaryOp(n1, op, n2);
		}
		if (n1 instanceof StringObject && n2 instanceof StringObject) {
			this.doStringBinaryOp(n1, op, n2);
		}
	}
	private doIntegerBinaryOp(n1: IntegerObject, op: OpCodes, n2: IntegerObject) {
		switch (op) {
			case OpCodes.OpAdd:
				return this.push(new IntegerObject(n1.value + n2.value));
			case OpCodes.OpMult:
				return this.push(new IntegerObject(n1.value * n2.value));
			case OpCodes.OpDiv:
				return this.push(new IntegerObject(n1.value / n2.value));
			case OpCodes.OpSub: {
				return this.push(new IntegerObject(n1.value - n2.value));
			}

			default:
				break;
		}
	}
	private doStringBinaryOp(n1: StringObject, op: OpCodes, n2: StringObject) {
		if (op !== OpCodes.OpAdd) {
			return this.push(
				new ErrorObject(
					`operator ${definitionsMap[op].char} cannot be used with strings`,
				),
			);
		}
		return this.push(new StringObject(n1.value + n2.value));
	}
	private executeComparison(op: OpCodes) {
		const right = this.pop();
		const left = this.pop();
		if (left?.type() !== right?.type()) {
			return this.push(
				new ErrorObject(
					`type mismatch: ${left?.type()} ${definitionsMap[op].char} ${right?.type()}`,
				),
			);
		}
		if (left instanceof IntegerObject && right instanceof IntegerObject) {
			return this.executeIntegerComparison(left, op, right);
		}
		if (left instanceof StringObject && right instanceof StringObject) {
			return this.executeStringComparison(left, op, right);
		}
		if (left instanceof BooleanObject && op === OpCodes.OpAnd) {
			return this.push(
				this.nativeBoolToBooleanObject(
					left.value && (right as BooleanObject).value,
				),
			);
		}
		if (left instanceof BooleanObject && op === OpCodes.OpOr) {
			return this.push(
				this.nativeBoolToBooleanObject(
					left.value || (right as BooleanObject).value,
				),
			);
		}
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
	private executeIntegerComparison(
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
	private executeStringComparison(
		left: StringObject,
		op: OpCodes,
		right: StringObject,
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

			default:
				return this.push(
					new ErrorObject(
						`operator ${definitionsMap[op].char} cannot be used with strings`,
					),
				);
		}
	}
	private executeBangOperator() {
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
	private executeMinusOperator() {
		const val = this.pop();
		if (!(val instanceof IntegerObject)) {
			return this.push(
				new ErrorObject("TypeError: unsupported type for negation"),
			);
		}
		this.push(new IntegerObject(-val.value));
	}
	private buildHash(numOfPairs: number) {
		const map = new Map();
		for (let i = 0; i < numOfPairs; i++) {
			const value = this.pop();
			const key = this.pop();

			const pair = {
				key,
				value,
			};
			if (
				!(
					key instanceof StringObject ||
					key instanceof IntegerObject ||
					key instanceof BooleanObject
				)
			) {
				return this.push(
					new ErrorObject(`cannot use ${key?.type()} as hash key`),
				);
			}
			map.set(key!.value, pair);
		}
		return map;
	}

	private isTruthy(obj: Maybe<InternalObject>) {
		if (obj instanceof BooleanObject) {
			return obj.value;
		}
		if (obj === NULL_OBJ) return false;
		return true;
	}
	private indexArray(arr: ArrayObject, idx: Maybe<InternalObject>) {
		if (!(idx instanceof IntegerObject)) {
			return this.push(
				new ErrorObject(`${idx?.type()} cannot be used to index arrays`),
			);
		}
		if (idx.value < 0 || idx.value > arr.elements.length - 1) {
			this.push(NULL_OBJ);
		} else {
			this.push(arr.elements.at(idx.value));
		}
	}
	private indexHash(hash: HashObject, idx: Maybe<InternalObject>) {
		if (
			!(
				idx instanceof IntegerObject ||
				idx instanceof BooleanObject ||
				idx instanceof StringObject
			)
		) {
			return new ErrorObject(`${idx?.type()} cannot be used to index arrays`);
		}
		const pair = hash.pairs.get(idx.value);
		if (!pair) {
			this.push(NULL_OBJ);
		} else {
			this.push(pair.value);
		}
	}
	private get currentFrame() {
		return this.frames[this.framesIndex - 1];
	}
	private pushFrame(frame: Frame) {
		this.frames[this.framesIndex] = frame;
		this.framesIndex++;
	}
	private popFrame() {
		this.framesIndex--;
		return this.frames[this.framesIndex];
	}
	private getFreeVariables(numFree: number) {
		const free: Maybe<InternalObject>[] = [];
		for (let i = 0; i < numFree; i++) {
			free[i] = this.stack[this.stackPointer - numFree + i];
		}
		this.stackPointer = this.stackPointer - numFree;
		return free;
	}
	private nativeBoolToBooleanObject(bool: boolean) {
		return bool ? TRUE_OBJ : FALSE_OBJ;
	}
}
