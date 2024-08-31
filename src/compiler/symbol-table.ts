import type { Maybe } from "../utils/types";

export enum SymbolScope {
	GlobalScope = "GLOBAL",
	LocalScope = "LOCAL",
	BuiltinScope = "BUILTIN",
	FreeScope = "FREE",
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
	public freeSymbols: SymbolType[] = [];

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
	defineFree(original: SymbolType) {
		this.freeSymbols.push(original);
		const symbol = {
			name: original.name,
			scope: SymbolScope.FreeScope,
			index: this.freeSymbols.length - 1,
		};
		this.store.set(original.name, symbol);
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
			if (
				sym?.scope === SymbolScope.GlobalScope ||
				sym?.scope === SymbolScope.BuiltinScope ||
				!sym
			) {
				return sym;
			}
			const free = this.defineFree(sym);

			return free;
		}
		return symbol;
	}
	static newEnclosedSymbolTable(outer: SymbolTable) {
		const newSymbolTable = new SymbolTable();
		newSymbolTable.outer = outer;
		return newSymbolTable;
	}
}
