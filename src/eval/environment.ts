import type { Identifier } from "../ast/ast";
import { ErrorObject, type InternalObject } from "../object/object";
import type { Maybe } from "../utils/types";

export class Environment {
	public store = new Map<string, Maybe<InternalObject>>();
	get(key: string) {
		return this.store.get(key);
	}
	set(key: string, value: Maybe<InternalObject>) {
		return this.store.set(key, value);
	}
}
export const evalIdentifier = (node: Identifier, env: Environment) => {
	const value = env.get(node.value);
	if (!value) {
		return new ErrorObject(`identifier not found: ${node.value}`);
	}
	return value;
};
