import index from "./index.html";
import { readAllExperiments } from "../shared/store.ts";

const DEFAULT_PORT = 8000;

const server = Bun.serve({
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  development: { hmr: true, console: false },
  routes: {
    "/": index,
    "/api/experiments": () => Response.json(readAllExperiments()),
  },
});

console.log(`Dashboard on ${server.url}`);
