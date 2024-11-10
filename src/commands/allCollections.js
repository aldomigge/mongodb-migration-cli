import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import logger from '../log.js';

async function getAllCollections() {
  try {
    const connection = await connectToMongoDB({ logger_flag: true });

    return connection.db.listCollections().toArray();
  } catch (error) {
    logger.error('[MODELO]: ERRO AO OBTER AS COLEÇÕES:', error.message);
    process.exit(1);
  }
}

const allCollectionsCommand = async () => {
  await connectToMongoDB({ logger_flag: true });

  const collections = await getAllCollections();

  logger.info('[ALL-COLLECTIONS]: COLEÇÕES ENCONTRADAS:');
  collections.forEach((collection) => logger.info(collection.name));

  await disconnectFromMongoDB({ logger_flag: true });
};

export default allCollectionsCommand;
