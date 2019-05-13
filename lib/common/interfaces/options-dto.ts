interface WorkerOptionsDto {
  readonly processName: string;
  readonly durationInSecondsToAlert: number;
}

interface InsertUpdateHelperFields {
  [index: string]: {
    key: string,
    type: string,
  }
}

export {
  WorkerOptionsDto,
  InsertUpdateHelperFields,
};
