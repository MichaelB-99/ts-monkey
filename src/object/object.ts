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
	NULL_OBJ = "NULL",
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
export const TRUE_OBJ = new BooleanObject(true);
export const FALSE_OBJ = new BooleanObject(false);
export const NULL_OBJ = new NullObject();
