import { Context } from "hono";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { Bindings } from "../bindings";
import { tagSchema } from "../schema";
import {
  createTag,
  deleteAllTags,
  deleteTagByName as deleteTagByName,
  getAllTags,
  getTagByName,
  updateTagByName,
} from "../model/tags";

const tagApi = new Hono<{ Bindings: Bindings }>();

tagApi.post("/:name", zValidator("json", tagSchema), async (c) => {
  const validData = await c.req.valid("json");
  const tagName = c.req.param("name");
  const res = await createTag(c, validData);
  return generateResponse(c, { [tagName]: res });
});

tagApi.get("/:name", async (c) => {
  const tag = await getTagByName(c);
  const tagName = c.req.param("name");
  const res = tag ? { [tagName]: tag } : null;
  return generateResponse(c, res);
});

tagApi.get("*", async (c) => {
  const res = await getAllTags(c);
  return generateResponse(c, res);
});

tagApi.patch("/:name", zValidator("json", tagSchema), async (c) => {
  const validData = await c.req.valid("json");
  const tag = await updateTagByName(c, validData);
  const tagName = c.req.param("name");
  const res = tag ? { [tagName]: tag } : null;
  return generateResponse(c, res);
});

tagApi.delete("/", async (c) => {
  const res = await deleteAllTags(c);
  return generateResponse(c, { deletedTags: res });
});

tagApi.delete("/:name", async (c) => {
  const deletedTag = await deleteTagByName(c);
  const res = deletedTag ? { deletedTag: deletedTag } : null;
  return generateResponse(c, res);
});

export default tagApi;

function generateResponse(c: Context<{ Bindings: Bindings }>, data: unknown) {
  if (data) {
    const statusCode = data ? 200 : 204;
    return c.json(data, statusCode);
  } else {
    return new Response(null, { status: 204 });
  }
}
