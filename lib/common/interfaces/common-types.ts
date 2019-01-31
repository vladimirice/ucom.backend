interface StringToNumberCollection {
  [index: string]: number;
}

interface NumberToNumberCollection {
  [index: number]: number;
}

interface StringToAnyCollection {
  [index: string]: any;
}

interface NumberToAnyCollection {
  [index: number]: any;
}

export {
  StringToNumberCollection,
  StringToAnyCollection,
  NumberToNumberCollection,
  NumberToAnyCollection,
};
