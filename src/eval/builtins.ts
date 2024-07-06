import {
	ArrayObject,
	BuiltInObject,
	ErrorObject,
	type FunctionObject,
	IntegerObject,
	type InternalObject,
	NULL_OBJ,
	ObjectType,
} from "../object/object";
import type { Maybe } from "../utils/types";
import { applyFunction } from "./eval";

export const builtins: Record<string, BuiltInObject> = {
	len: new BuiltInObject((...args) => {
		if (args.length !== 1) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=1`,
			);
		}
		const arg = args[0];
		switch (arg?.type()) {
			case ObjectType.STRING_OBJ:
				return new IntegerObject(arg!.inspect().length);

			case ObjectType.ARRAY_OBJ:
				return new IntegerObject((arg as ArrayObject).elements.length);
			default:
				return new ErrorObject(
					`argument to 'len' not supported, got ${args[0]!.type()}`,
				);
		}
	}),
	first: new BuiltInObject((...args) => {
		if (args.length !== 1) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=1`,
			);
		}
		const arg = args[0] as ArrayObject;
		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'first' function only accepts an array, got: ${arg.type()}`,
			);
		}
		return arg.elements[0] || NULL_OBJ;
	}),
	last: new BuiltInObject((...args) => {
		if (args.length !== 1) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=1`,
			);
		}
		const arg = args[0] as ArrayObject;
		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'last' function only accepts an array, got: ${arg.type()}`,
			);
		}
		return arg.elements.at(-1) || NULL_OBJ;
	}),
	rest: new BuiltInObject((...args) => {
		if (args.length !== 1) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=1`,
			);
		}
		const arg = args[0] as ArrayObject;
		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'rest' function only accepts an array, got: ${arg.type()}`,
			);
		}
		return new ArrayObject(arg.elements.slice(1));
	}),
	push: new BuiltInObject((...args) => {
		if (args.length !== 2) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=2`,
			);
		}
		const arg = args[0] as ArrayObject;
		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'push' function only accepts an array, got: ${arg.type()}`,
			);
		}
		const clone = arg.elements.slice();
		clone.push(args[1]);
		return new ArrayObject(clone);
	}),
	map: new BuiltInObject((...args) => {
		if (args.length !== 2) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=1`,
			);
		}
		const arg = args[0] as Maybe<ArrayObject>;
		const arg2 = args[1] as Maybe<FunctionObject>;

		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'map' function only accepts an array, got: ${arg?.type()}`,
			);
		}
		if (arg2?.type() !== ObjectType.FUNCTION_OBJ) {
			return new ErrorObject(
				`'map' second parameter must be a function, got: ${arg2?.type()}`,
			);
		}
		const result: Maybe<InternalObject>[] = [];
		arg.elements.forEach((el, i) => {
			result.push(applyFunction(arg2, [el, new IntegerObject(i)]));
		});
		return new ArrayObject(result);
	}),
	find: new BuiltInObject((...args) => {
		if (args.length !== 2) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=1`,
			);
		}
		const arg = args[0] as Maybe<ArrayObject>;
		const arg2 = args[1] as Maybe<FunctionObject>;

		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'find' function only accepts an array, got: ${arg?.type()}`,
			);
		}
		if (arg2?.type() !== ObjectType.FUNCTION_OBJ) {
			return new ErrorObject(
				`'find' second parameter must be a function, got: ${arg2?.type()}`,
			);
		}
		for (const el of arg.elements) {
			const res = applyFunction(arg2, [el]);

			if (res?.type() !== ObjectType.BOOLEAN_OBJ) {
				return new ErrorObject(
					`callback function to 'find' must evaluate to a boolean value. got: ${res?.type()}`,
				);
			}

			if (res?.inspect() === "true") {
				return el;
			}
		}
		return NULL_OBJ;
	}),
	reduce: new BuiltInObject((...args) => {
		if (args.length < 2) {
			return new ErrorObject(
				`wrong number of arguments. got=${args.length}, want=2|3`,
			);
		}
		const arg = args[0] as Maybe<ArrayObject>;
		const arg2 = args[1] as Maybe<FunctionObject>;
		const arg3 = args[2] as Maybe<InternalObject>;

		if (arg?.type() !== ObjectType.ARRAY_OBJ) {
			return new ErrorObject(
				`'reduce' function only accepts an array, got: ${arg?.type()}`,
			);
		}
		if (arg2?.type() !== ObjectType.FUNCTION_OBJ) {
			return new ErrorObject(
				`'reduce' second parameter must be a function, got: ${arg2?.type()}`,
			);
		}
		const copy = arg.elements;
		let result = arg3 ?? copy.shift();
		for (const el of copy) {
			result = applyFunction(arg2, [result, el]);
		}
		return result;
	}),
};
