import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Por favor, define la variable de entorno MONGODB_URI");
}

export const connectDB = async () => {
  try {
    console.log("Intentando conectar a MongoDB...");
    const { connection } = await mongoose.connect(MONGODB_URI as string);
    if (connection.readyState === 1) {
      console.log("Conexión exitosa a MongoDB");
      return Promise.resolve(true);
    }
    console.log("Fallo al conectar a MongoDB. Estado de conexión:", connection.readyState);
    return Promise.reject("Fallo al conectar a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    return Promise.reject(error);
  }
};