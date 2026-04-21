import { Transaction } from 'sequelize';
import { sequelize } from './sequelize.config';

/**
 * Executes a callback inside a Sequelize transaction.
 * Automatically commits if the callback succeeds, or rolls back if it throws.
 */
export const runInTransaction = async <T>(
  callback: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
