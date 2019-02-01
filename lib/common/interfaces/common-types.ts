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

interface IdOnlyDto {
  readonly id: number;
}

export {
  StringToNumberCollection,
  StringToAnyCollection,
  NumberToNumberCollection,
  NumberToAnyCollection,
  IdOnlyDto,
};
