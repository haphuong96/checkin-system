export const PrismaErrorCode = {
  /** Unique constraint failed on the {constraint} */
  P2002_UNIQUE_CONSTRAINT: 'P2002',
  /** Foreign key constraint failed on the field: {field_name} */
  P2003_FOREIGN_KEY_CONSTRAINT: 'P2003',
  /** An operation failed because it depends on one or more records that were required but not found. {cause} */
  P2025_RECORD_NOT_FOUND: 'P2025',
  /** Transaction failed due to a write conflict or a deadlock. Please retry your transaction */
  P2034_TRANSACTION_CONFLICT: 'P2034',
} as const;
