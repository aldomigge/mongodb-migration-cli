import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';

const testCommand = async () => {
  await connectToMongoDB({ logger_flag: true });
  await disconnectFromMongoDB({ logger_flag: true });
};

export default testCommand;
