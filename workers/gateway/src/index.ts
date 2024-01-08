import { Hono } from "hono";

type Bindings = {
  BLOG_SERVICE: Fetcher;
  CMS_SERVICE: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.all("/blog/*", async (c) => {
  const res = await c.env.BLOG_SERVICE.fetch(c.req.raw);
  return res;
});
app.all("/cms/*", async (c) => {
  const res = await c.env.CMS_SERVICE.fetch(c.req.raw);
  return res;
});
app.all("/", (c) => c.text("Hello Hono!"));

export default app;
