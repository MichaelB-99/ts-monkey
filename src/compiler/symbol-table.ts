import type { Maybe } from "../utils/types";

export enum SymbolScope {
	GlobalScope = "GLOBAL",
}
export type SymbolType = {
	name: string;
	scope: SymbolScope;
	index: number;
};

export class SymbolTable {
	private numDefs = 0;
	private readonly store = new Map<string, SymbolType>();

	define(name: string): SymbolType {
		const symbol = {
			name,
			index: this.numDefs,
			scope: SymbolScope.GlobalScope,
		};
		this.store.set(name, symbol);
		this.numDefs++;
		return symbol;
	}
	resolve(name: string): Maybe<SymbolType> {
		const symbol = this.store.get(name);
		return symbol;
	}
}
