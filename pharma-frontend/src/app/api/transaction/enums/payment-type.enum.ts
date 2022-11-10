export enum PaymentType {
  CASH = 'Μετρητά',
  BANK = 'Τράπεζα',
  ON_ACCOUNT = 'Επί πιστώσει',
  PREVIOUS_MONTHS_RECEIPTS = 'Είσπραξη προηγούμενων μηνών',
  POS = 'POS',
  EXTRA = 'Extra',
  PRESCRIPT = 'Επιταγή',
  NONE = ''
}

export namespace PaymentType {
  const reverseMap = new Map<number, string>();
  const indexMap = new Map<string, number>();
  Object.keys(PaymentType).forEach((s: string, index) => {
    const e = (<any>PaymentType)[s];
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
