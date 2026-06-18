/* eslint-disable @typescript-eslint/require-await */
export const sql = {
  unsafe: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    sql: String.raw(strings, ...values),
    values,
  }),
};

export const createPool = async () => ({
  connect: async () => undefined,
  end: async () => undefined,
});

export type DatabasePool = {
  connect: (handler: (connection: unknown) => Promise<void>) => Promise<void>;
  end: () => Promise<void>;
};

export type DatabaseTransactionConnection = {
  query: (query: unknown) => Promise<unknown>;
};
