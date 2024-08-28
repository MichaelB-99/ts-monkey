import type { Maybe } from "../utils/types";

export enum SymbolScope {
	GlobalScope = "GLOBAL",
	LocalScope = "LOCAL",
	BuiltinScope = "BUILTIN",
}
export type SymbolType = {
	name: string;
	scope: SymbolScope;
	index: number;
};

export class SymbolTable {
	public numDefs = 0;
	private readonly store = new Map<string, SymbolType>();
	public outer?: SymbolTable;

	define(name: string): SymbolType {
		const scope = this.outer ? SymbolScope.LocalScope : SymbolScope.GlobalScope;
		const symbol = {
			name,
			index: this.numDefs,
			scope,
		};
		this.store.set(name, symbol);
		this.numDefs++;
		return symbol;
	}
	defineBuiltin(index: number, name: string) {
		const symbol = { name, scope: SymbolScope.BuiltinScope, index };
		this.store.set(name, symbol);
		return symbol;
	}
	resolve(name: string): Maybe<SymbolType> {
		const symbol = this.store.get(name);
		if (!symbol && this.outer) {
			const sym = this.outer.resolve(name);
			return sym;
		}
		return symbol;
	}
	static newEnclosedSymbolTable(outer: SymbolTable) {
		const newSymbolTable = new SymbolTable();
		newSymbolTable.outer = outer;
		return newSymbolTable;
	}
}
