import {
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
		if (args[0]?.type() !== ObjectType.STRING_OBJ) {
			return new ErrorObject(
				`argument to 'len' not supported, got ${args[0]!.type()}`,
			);
		}
		return new IntegerObject(args[0].inspect().length);
	}),
};
