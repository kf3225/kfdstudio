import { Hono } from "hono";

import postApi from "./api/posts";
import tagApi from "./api/tags";

const app = new Hono();
app.route("/cms/api/posts", postApi);
app.route("/cms/api/tags", tagApi);

export default { port: 8787, fetch: app.fetch };
