import type { BlockStatement, Identifier } from "../ast/ast";
import type { Environment } from "../eval/environment";
import type { Maybe } from "../utils/types";

export interface InternalObject {
	type(): ObjectType;
	inspect(): string;
}

export class IntegerObject implements InternalObject {
	constructor(public value: number) {}
	inspect(): string {
		return String(this.value);
	}
	type(): ObjectType {
		return ObjectType.INTEGER_OBJ;
	}
}

export class BooleanObject implements InternalObject {
	constructor(public value: boolean) {}
	inspect(): string {
		return String(this.value);
	}
	type(): ObjectType {
		return ObjectType.BOOLEAN_OBJ;
	}
}
export class NullObject implements InternalObject {
	inspect(): string {
		return "null";
	}
	type(): ObjectType {
		return ObjectType.NULL_OBJ;
	}
}

export enum ObjectType {
	INTEGER_OBJ = "INTEGER",
	BOOLEAN_OBJ = "BOOLEAN",
	RETURN_VALUE_OBJ = "RETURN",
	FUNCTION_OBJ = "FUNCTION",
	STRING_OBJ = "STRING",
	NULL_OBJ = "NULL",
	ERROR_OBJ = "ERROR",
	BUILT_IN_OBJ = "BUILTIN",
	ARRAY_OBJ = "ARRAY",
	HASH_OBJ = "HASH",
}

export class ReturnValueObject implements InternalObject {
	constructor(public value: InternalObject) {}

	type(): ObjectType {
		return ObjectType.RETURN_VALUE_OBJ;
	}
	inspect(): string {
		return String(this.value);
	}
}
export class ErrorObject implements InternalObject {
	constructor(public msg: string) {}
	type(): ObjectType {
		return ObjectType.ERROR_OBJ;
	}
	inspect(): string {
		return `ERROR: ${this.msg}`;
	}
}
export class FunctionObject implements InternalObject {
	constructor(
		public params: Identifier[],
		public body: BlockStatement,
		public env: Environment,
	) {}
	type(): ObjectType {
		return ObjectType.FUNCTION_OBJ;
	}
	inspect(): string {
		return `fn(${this.params.join(",")}){
			${this.body.string()}
		}`;
	}
}
export class StringObject implements InternalObject {
	constructor(public value: string) {}
	type(): ObjectType {
		return ObjectType.STRING_OBJ;
	}
	inspect(): string {
		return this.value;
	}

	// hashKey() {
	// 	return `${this.type()}|${this.value}`;
	// }
}
type BuiltinFunction = (
	...args: Maybe<InternalObject>[]
) => Maybe<InternalObject>;
export class BuiltInObject implements InternalObject {
	constructor(public fn: BuiltinFunction) {}
	type(): ObjectType {
		return ObjectType.BUILT_IN_OBJ;
	}
	inspect(): string {
		return "builtin function";
	}
}
export class ArrayObject implements InternalObject {
	constructor(public elements: Maybe<InternalObject>[]) {}
	type(): ObjectType {
		return ObjectType.ARRAY_OBJ;
	}
	inspect(): string {
		return `[${this.elements.map((e) => e?.inspect()).join(", ")}]`;
	}
}

export type HashKey = string | number | boolean;
type HashPair = {
	key: StringObject | IntegerObject | BooleanObject;
	value: Maybe<InternalObject>;
};
export type HashPairs = Map<HashKey, HashPair>;
export class HashObject implements InternalObject {
	constructor(public pairs: HashPairs) {}
	type(): ObjectType {
		return ObjectType.HASH_OBJ;
	}
	inspect(): string {
		return `{${Array.from(this.pairs.values())
			.map(({ key, value }) => `${key.inspect()}:${value?.inspect()}`)
			.join(", ")}}`;
	}
}
export const TRUE_OBJ = new BooleanObject(true);
export const FALSE_OBJ = new BooleanObject(false);
export const NULL_OBJ = new NullObject();
