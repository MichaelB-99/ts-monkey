import type { InternalObject } from "../object/object";
import type { Maybe } from "../utils/types";

export class Environment {
	public store = new Map<string, Maybe<InternalObject>>();
	public outer?: Environment;
	get(key: string): Maybe<InternalObject> {
		const value = this.store.get(key);
		if (!value && this.outer) {
			return this.outer.get(key);
		}
		return value;
	}
	set(key: string, value: Maybe<InternalObject>) {
		return this.store.set(key, value);
	}

	static newEnclosedEnvironment(outer: Environment) {
		const env = new Environment();
		env.outer = outer;
		return env;
	}
}
