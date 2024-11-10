const migrationTemplateJS = () => `
import * as MigrateHelper from '../index.js';

export const up = async () => {
  try {
    // TODO: Adicionar sua lógica de migração aqui

  } catch (error) {
    throw error;
  }
};

export const down = async () => {
  try {
    // TODO: Adicionar sua lógica de rollback aqui

  } catch (error) {
    throw error;
  }
};
`;

export { migrationTemplateJS };
