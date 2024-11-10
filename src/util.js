export const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// const verifyCollectionExistsAndCreated = async () => {
//   await connectToMongoDB({ logger_flag: false });

//   const collections = await getAllCollections();

//   if (!collections.find((col) => col.name === collection)) {
//     await mongoose.connection.db.createCollection(collection);
//     logger.info(`[INIT]: COLEÇÃO ${collection} CRIADA COM SUCESSO!`);
//   }

//   await disconnectFromMongoDB({ logger_flag: false });
// };

// const verifyCollection = async () => {
//   await connectToMongoDB({ logger_flag: false });

//   const collections = await getAllCollections();

//   if (!collections.find((col) => col.name === collection)) {
//     logger.error(
//       `[INIT]: COLEÇÃO ${collection} NÃO ENCONTRADA. CRIE A COLEÇÃO MANUALMENTE OU EXECUTE O COMANDO "init" PARA CRIAR A COLEÇÃO AUTOMATICAMENTE.`,
//     );
//     process.exit(1);
//   }

//   await disconnectFromMongoDB({ logger_flag: false });
// };
