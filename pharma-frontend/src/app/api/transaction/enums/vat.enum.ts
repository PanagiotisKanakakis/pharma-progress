export enum VAT {
  NONE = '-1',
  ZERO = '0',
  SIX = '6',
  THIRTEEN = '13',
  TWENTYFOUR = '24',
}

export namespace VAT {
  const reverseMap = new Map<number, string>();
  const indexMap = new Map<string, number>();
  Object.keys(VAT).forEach((s: string, index) => {
    const e = (<any>VAT)[s];
    reverseMap.set(index, e.toString());
    indexMap.set(e.toString(), index);
  });

  export function valueOf(value: number) {
    return reverseMap.get(value);
  }

  export function getIndexOf(str: string) {
    return indexMap.get(str);
  }
}
