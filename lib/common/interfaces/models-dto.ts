interface IModelFieldsSet {
  [index: string]: {
    readonly type: string;
    readonly request?: {
      sanitizationType: string;
    }
  }
}

export {
  IModelFieldsSet,
};
