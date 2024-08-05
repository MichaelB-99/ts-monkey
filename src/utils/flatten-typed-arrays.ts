// right now we just need to support uint8arrays
export const flattenTypedArrays = (arr: Uint8Array[]) =>
	arr.flatMap((a) => Array.from(a));
