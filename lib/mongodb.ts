import { MongoClient, ServerApiVersion } from "mongodb";

let client: MongoClient | null = null;
let connecting: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;
  if (connecting) return connecting;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI env");
  }

  const c = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  connecting = c.connect().then((conn) => {
    client = conn;
    connecting = null;
    return conn;
  });

  return connecting;
}

export async function getDb() {
  const dbName = process.env.MONGODB_DB || "test";
  const conn = await getMongoClient();
  return conn.db(dbName);
}
