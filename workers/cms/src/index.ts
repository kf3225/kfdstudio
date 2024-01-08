import { Hono } from "hono";
import { cors } from "hono/cors";

import postApi from "./api/posts";
import tagApi from "./api/tags";

const app = new Hono();
// app.use(
//   "/api/*",
//   cors({
//     origin: (origin) => {
//       console.log(origin)
//       return origin.endsWith("kfdstudio.work")
//         ? origin
//         : "http://localhost:3000";
//     },
//     allowMethods: ["POST", "PUT", "PATCH", "GET", "OPTIONS"],
//     maxAge: 600,
//   })
// );
app.route("/api/posts", postApi);
app.route("/api/tags", tagApi);

export default { port: 8787, fetch: app.fetch };
