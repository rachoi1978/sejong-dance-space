import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) { throw new Error("MONGODB_URI is not set"); }

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise!;
export default clientPromise;
