export enum TransactionType {
  INCOME = 'Πώληση',
  EOPPY = 'ΕΟΠΠΥ',
  PERSONAL_WITHDRAWALS = 'Προσωπικές αναλήψεις',
  EXPENSE = 'Αγορά',
  RENT = 'Ενοίκιο',
  INSURANCE_CONTRIBUTION = 'Ασφαλιστκές εισφορές',
  PAYROLL = 'Μισθοδοσία',
  ACCOUNTANT = 'Λογιστής',
  EFKA = 'ΕΦΚΑ',
  ELECTRICITY_BILL = 'Ηλεκτρισμός',
  PHONE_BILL = 'Τηλεφωνία',
  CONSUMABLES = 'Γραφική ύλη-αναλώσιμα',
  BANK_CHARGES = 'Έξοδα τραπεζών',
  WATER_SUPPLY = 'ΕΥΔΑΠ',
  TAXES = 'Φόρος',
  OTHER_EXPENSES = 'Άλλα έξοδα',
  PAYMENT = 'Πληρωμή'
}

export namespace TransactionType {
  const reverseMap = new Map<number, string>();
  const indexMap = new Map<string, number>();
  Object.keys(TransactionType).forEach((s: string, index) => {
    const e = (<any>TransactionType)[s];
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

