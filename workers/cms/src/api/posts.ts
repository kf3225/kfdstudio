import { Context } from "hono";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Bindings } from "../bindings";
import { postSchema } from "../schema";
import {
  createPost,
  getPostsByTag,
  getAllPosts,
  getPostsByEntry,
  deleteAllPosts,
  getPostById,
  updatePostById,
  deletePostById,
} from "../model/posts";

const postApi = new Hono<{ Bindings: Bindings }>();

postApi.post("/", zValidator("json", postSchema), async (c) => {
  const validData = await c.req.valid("json");
  const res = await createPost(c, validData);
  return generateResponse(c, res);
});

postApi.get("/:id", async (c) => {
  const res = await getPostById(c);
  return generateResponse(c, res);
});

postApi.get("/:year/:month/:day", async (c) => {
  const res = await getPostsByEntry(c);
  return generateResponse(c, res);
});

postApi.get("*", async (c) => {
  const tags = c.req.queries("tags");
  const getPost = tags ? getPostsByTag : getAllPosts;
  const res = await getPost(c);
  return generateResponse(c, res);
});

postApi.patch("/:id", zValidator("json", postSchema), async (c) => {
  const validData = await c.req.valid("json");
  const res = await updatePostById(c, validData);
  return generateResponse(c, res);
});

postApi.delete("/", async (c) => {
  const res = await deleteAllPosts(c);
  return generateResponse(c, res);
});

postApi.delete("/:id", async (c) => {
  const res = await deletePostById(c);
  return generateResponse(c, res);
});

export default postApi;

function generateResponse(c: Context<{ Bindings: Bindings }>, data: unknown) {
  if (data) {
    return c.json(data, 200);
  } else {
    return new Response(null, { status: 204 });
  }
}
