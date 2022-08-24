export enum SupplierType {
    NONE = '',
    MAIN = 'Κύριος Προμηθευτής',
    OTHER = 'Άλλος Προμηθευτής',
}


export namespace SupplierType {
    const reverseMap = new Map<number, string>();
    const indexMap = new Map<string, number>();
    Object.keys(SupplierType).forEach((s: string, index) => {
        const e = (<any>SupplierType)[s];
        reverseMap.set(e.toString(), s);
        indexMap.set(e.toString(), index);
    });

    export function valueOf(value: number) {
        return reverseMap.get(value);
    }

    export function getIndexOf(str: string) {
        return indexMap.get(str);
    }
}
