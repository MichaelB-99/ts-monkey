import type { CompiledFunctionObject } from "../object/object";

export class Frame {
	public ip = -1;
	constructor(private fn: CompiledFunctionObject) {}
	get instructions() {
		return this.fn.instructions;
	}
}
