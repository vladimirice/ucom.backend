interface StringToNumberCollection {
  [index: string]: number;
}

interface NumberToNumberCollection {
  [index: number]: number;
}

interface IdToPropsCollection {
  [index: number]: {
    [index: string]: string | number;
  }
}

interface IdToNumberCollection extends NumberToNumberCollection {}

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
  IdToPropsCollection,
  IdOnlyDto,
  IdToNumberCollection,
};
