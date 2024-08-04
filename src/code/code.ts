export type Instructions = Uint8Array;
export type OpCode = number;

// biome-ignore lint/style/useEnumInitializers: <explanation>
export enum OpCodes {
	OpConstant,
}
type Definition = {
	name: string;
	// num of bytes each operand takes up so [1,2] would be a 1 byte (8 bit) operand followed by a 2 byte (16 bit) operand e.g [255,65535]
	operandWidths: number[];
};

export const definitionsMap: Record<OpCodes, Definition> = {
	[OpCodes.OpConstant]: {
		name: OpCodes[OpCodes.OpConstant],
		operandWidths: [2],
	},
};
export const lookupOpCode = (opcode: OpCodes) => {
	const def = definitionsMap[opcode];
	if (!def) {
		throw new Error(`opcode undefined ${opcode}`);
	}
	return def;
};

export function make(opcode: OpCodes, ...operands: number[]) {
	const def = definitionsMap[opcode];
	if (!def) return new Uint8Array();
	let instructionLen = 1;
	def.operandWidths.forEach((w) => {
		instructionLen += w;
	});
	const buffer = new ArrayBuffer(instructionLen);
	const dv = new DataView(buffer);

	dv.setUint8(0, opcode);

	let offset = 1;

	operands.forEach((o, i) => {
		const width = def.operandWidths[i];
		switch (width) {
			case 2:
				dv.setUint16(offset, o);
				break;
		}

		offset += width;
	});
	return new Uint8Array(dv.buffer);
}
export function readOperands(def: Definition, ins: Instructions) {
	const dv = new DataView(ins.buffer);
	const operands: number[] = [];
	let offset = 0;
	def.operandWidths.forEach((w, i) => {
		switch (w) {
			case 2:
				operands[i] = dv.getUint16(offset);

				break;

			default:
				break;
		}
		offset += w;
	});
	return [operands, offset];
}
