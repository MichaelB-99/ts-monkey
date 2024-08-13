import { describe, expect, it } from "bun:test";
import { SymbolScope, SymbolTable, type SymbolType } from "./symbol-table";
describe("define", () => {
	it("should create and return the symbol", () => {
		const expected: Record<"a" | "b", SymbolType> = {
			a: {
				name: "a",
				scope: SymbolScope.GlobalScope,
				index: 0,
			},
			b: {
				name: "b",
				scope: SymbolScope.GlobalScope,
				index: 1,
			},
		};
		const global = new SymbolTable();
		expect(global.define("a")).toEqual(expected.a);
		expect(global.define("b")).toEqual(expected.b);
	});
});
describe("resolve", () => {
	it("should return the symbol", () => {
		const expected: SymbolType[] = [
			{
				name: "a",
				scope: SymbolScope.GlobalScope,
				index: 0,
			},
			{
				name: "b",
				scope: SymbolScope.GlobalScope,
				index: 1,
			},
		];

		const global = new SymbolTable();
		global.define("a");
		global.define("b");
		expected.forEach((sym) => {
			const res = global.resolve(sym.name);
			expect(res).toEqual(sym);
		});
	});
});
