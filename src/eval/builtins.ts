import {
	ArrayObject,
	BuiltInObject,
	ErrorObject,
	IntegerObject,
	NULL_OBJ,
	ObjectType,
} from "../object/object";

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
};
