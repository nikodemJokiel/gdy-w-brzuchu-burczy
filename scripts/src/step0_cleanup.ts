import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";

dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-07-23",
  useCdn: false,
});

async function run() {
  console.log("Deleting all recipes...");
  await client.delete({ query: '*[_type == "recipe"]' });
  
  console.log("Deleting all tags...");
  await client.delete({ query: '*[_type == "tag"]' });
  
  console.log("Done.");
}
run().catch(console.error);
