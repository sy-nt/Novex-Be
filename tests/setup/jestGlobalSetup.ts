module.exports = async (): Promise<void> => {
  const databaseName = process.env.DB_NAME;

  if (!databaseName) {
    return;
  }

  if (!databaseName.includes('test')) {
    throw new Error(
      `Current database name is: ${databaseName}. Make sure database includes a word "test" as prefix or suffix, for example: "test_db" or "db_test" to avoid writing into a main database.`,
    );
  }
};
