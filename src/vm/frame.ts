import type { CompiledFunctionObject } from "../object/object";

export class Frame {
	public ip = -1;
	constructor(
		private fn: CompiledFunctionObject,
		public basePointer: number,
	) {}
	get instructions() {
		return this.fn.instructions;
	}
}
