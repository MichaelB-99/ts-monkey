import {
	ArrayLiteral,
	BlockStatement,
	BooleanLiteral,
	CallExpression,
	ExpressionStatement,
	FunctionLiteral,
	HashLiteral,
	Identifier,
	IfExpression,
	IndexExpression,
	InfixExpression,
	IntegerLiteral,
	LetStatement,
	type Node,
	PrefixExpression,
	Program,
	ReturnStatement,
	StringLiteral,
} from "../ast/ast";
import { type Instructions, OpCodes, make } from "../code/code";
import {
	CompiledFunctionObject,
	IntegerObject,
	type InternalObject,
	StringObject,
} from "../object/object";
import type { Maybe } from "../utils/types";
import { SymbolTable } from "./symbol-table";

export class Compiler {
	public scopeIndex = 0;
	public scopes: CompilationScope[] = [
		{
			instructions: new Uint8Array(),
			lastInstruction: undefined,
			previousInstruction: undefined,
		},
	];
	constructor(
		private constants: Maybe<InternalObject>[] = [],
		private symbolTable: SymbolTable = new SymbolTable(),
	) {}

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

				case "||":
					this.emit(OpCodes.OpOr);
					break;
				case "&&":
					this.emit(OpCodes.OpAnd);
					break;
				default:
					break;
			}
		}
		if (node instanceof IfExpression) {
			this.compile(node.condition);
			const jumpNotTruthyPos = this.emit(OpCodes.OpJumpNotTruthy, 9999);
			this.compile(node.consequence);

			if (this.lastInstructionIs(OpCodes.OpPop)) {
				this.removeLastPop();
			}

			const jumpPos = this.emit(OpCodes.OpJump, 9999);
			const afterConsequencePos = this.currentInstructions.length;
			this.changeOperand(jumpNotTruthyPos, afterConsequencePos);

			if (!node.alternative) {
				this.emit(OpCodes.OpNull);
			} else {
				this.compile(node.alternative);
				if (this.lastInstructionIs(OpCodes.OpPop)) {
					this.removeLastPop();
				}
			}

			const afterAlternativePos = this.currentInstructions.length;
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
		if (node instanceof LetStatement) {
			this.compile(node.value);
			const symbol = this.symbolTable.define(node.name?.value!);
			this.emit(OpCodes.OpSetGlobal, symbol.index);
		}
		if (node instanceof Identifier) {
			const symbol = this.symbolTable.resolve(node.value);
			if (!symbol) {
				throw new Error(`undefined variable: ${node.value}`);
			}
			this.emit(OpCodes.OpGetGlobal, symbol.index);
		}

		if (node instanceof ArrayLiteral) {
			node.elements?.forEach((el) => this.compile(el));
			this.emit(OpCodes.OpArray, node.elements?.length!);
		}

		if (node instanceof HashLiteral) {
			const keys = Array.from(node.pairs!.keys());
			keys.forEach((key) => {
				this.compile(key);
				this.compile(node.pairs?.get(key));
			});
			this.emit(OpCodes.OpHash, node.pairs!.size);
		}

		if (node instanceof IntegerLiteral) {
			const integer = new IntegerObject(node.value!);
			this.emit(OpCodes.OpConstant, this.addConstant(integer));
		}
		if (node instanceof StringLiteral) {
			this.emit(
				OpCodes.OpConstant,
				this.addConstant(new StringObject(node.value)),
			);
		}
		if (node instanceof FunctionLiteral) {
			this.enterScope();
			this.compile(node.body);
			// i.e an arrow function without a block statement body e.g let onePlusTen = fn ()=> 1+10
			const isShortenedArrow =
				node.isArrow && !(node.body instanceof BlockStatement);
			if (this.lastInstructionIs(OpCodes.OpPop)) {
				this.removeLastPop();
				this.emit(OpCodes.OpReturnValue);
			} else if (isShortenedArrow) {
				this.emit(OpCodes.OpReturnValue);
			}

			if (!this.lastInstructionIs(OpCodes.OpReturnValue)) {
				this.emit(OpCodes.OpReturn);
			}

			const instructions = this.leaveScope();
			const fn = new CompiledFunctionObject(instructions);
			this.emit(OpCodes.OpConstant, this.addConstant(fn));
		}
		if (node instanceof CallExpression) {
			this.compile(node.func);
			this.emit(OpCodes.OpCall);
		}
		if (node instanceof ReturnStatement) {
			this.compile(node.value);
			this.emit(OpCodes.OpReturnValue);
		}
		if (node instanceof IndexExpression) {
			this.compile(node.left);
			this.compile(node.index);
			this.emit(OpCodes.OpIndex);
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
		const prev = this.scopes[this.scopeIndex].lastInstruction;
		this.scopes[this.scopeIndex].lastInstruction = { opcode: op, pos };
		this.scopes[this.scopeIndex].previousInstruction = prev;
	}
	removeLastPop() {
		const currScope = this.scopes[this.scopeIndex];
		currScope.instructions = this.currentInstructions.slice(
			0,
			currScope.lastInstruction?.pos,
		);
		currScope.lastInstruction = currScope.previousInstruction;
	}

	replaceInstruction(pos: number, newInstruction: Uint8Array) {
		for (let i = 0; i < newInstruction.length; i++) {
			this.currentInstructions[pos + i] = newInstruction[i];
		}
	}

	changeOperand(opPos: number, operand: number) {
		const newInstruction = make(
			this.scopes[this.scopeIndex].instructions[opPos],
			operand,
		);
		this.replaceInstruction(opPos, newInstruction);
	}
	enterScope() {
		const scope: CompilationScope = {
			instructions: new Uint8Array(),
			lastInstruction: undefined,
			previousInstruction: undefined,
		};
		this.scopes.push(scope);
		this.scopeIndex++;
	}
	leaveScope() {
		const instructions = this.currentInstructions;
		this.scopes.pop();
		this.scopeIndex--;
		return instructions;
	}
	addInstruction(ins: Uint8Array) {
		const pos = this.currentInstructions.length;
		const newArr = new Uint8Array(this.currentInstructions.length + ins.length);
		newArr.set(this.currentInstructions);
		newArr.set(ins, this.currentInstructions.length);
		this.scopes[this.scopeIndex].instructions = newArr;
		return pos;
	}
	lastInstructionIs(op: OpCodes) {
		return this.scopes[this.scopeIndex].lastInstruction?.opcode === op;
	}
	bytecode() {
		return new Bytecode(this.currentInstructions, this.constants);
	}
	get currentInstructions() {
		return this.scopes[this.scopeIndex].instructions;
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

type CompilationScope = {
	instructions: Instructions;
	previousInstruction: Maybe<EmittedInstruction>;
	lastInstruction: Maybe<EmittedInstruction>;
};
