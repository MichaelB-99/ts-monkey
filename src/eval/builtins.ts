import {
	type ArrayObject,
	BuiltInObject,
	ErrorObject,
	IntegerObject,
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
};
