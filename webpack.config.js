import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "production",
  entry: "./server/server.js",
  output: {
    path: path.resolve(__dirname, "netlify/functions"),
    filename: "server.js",
  },
  target: "node",
};