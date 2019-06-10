interface StringToNumberCollection {
  [index: string]: number;
}

interface NumberToStringCollection {
  [index: number]: string;
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

interface IRequestBody extends StringToAnyCollection {}

interface NumberToAnyCollection {
  [index: number]: any;
}

interface IdOnlyDto {
  readonly id: number;
}

export {
  StringToNumberCollection,
  StringToAnyCollection,
  NumberToStringCollection,
  NumberToNumberCollection,
  NumberToAnyCollection,
  IdToPropsCollection,
  IdOnlyDto,
  IdToNumberCollection,
  IRequestBody,
};
