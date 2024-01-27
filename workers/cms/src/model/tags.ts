import dayjs from "dayjs";
import { Context } from "hono";
import { z } from "zod";
import { Bindings } from "../bindings";
import { tagSchema } from "../schema";

type tagResponse = z.infer<typeof tagSchema>;

export async function createTag(
	c: Context<{ Bindings: Bindings }>,
	data: z.infer<typeof tagSchema>,
): Promise<tagResponse> {
	const now = dayjs().unix();
	const tagName = c.req.param("name");
	const payload = { ...data, createdAt: now, updatedAt: null };
	await c.env.kv_tags.put(tagName, JSON.stringify(payload));
	return payload;
}

export async function getAllTags(c: Context<{ Bindings: Bindings }>) {
	const allTags = await listTags(c);
	return allTags;
}

export async function getTagByName(c: Context<{ Bindings: Bindings }>) {
	const tagName = c.req.param("name");
	const res = await c.env.kv_tags.get<z.infer<typeof tagSchema>>(tagName);
	return res;
}

export async function updateTagByName(
	c: Context<{ Bindings: Bindings }>,
	data: z.infer<typeof tagSchema>,
) {
	const tagName = c.req.param("name");
	const now = dayjs().valueOf();
	const existsData =
		await c.env.kv_tags.get<z.infer<typeof tagSchema>>(tagName);
	if (existsData) {
		const payload = { ...existsData, ...data, updatedAt: now };
		await c.env.kv_tags.put(tagName, JSON.stringify(payload));
		return payload;
	}
	return null;
}

export async function deleteTagByName(
	c: Context<{ Bindings: Bindings }>,
): Promise<string | null> {
	const tagName = c.req.param("name");
	const data = await c.env.kv_tags.get(tagName);
	if (data) {
		await c.env.kv_tags.delete(tagName);
	}
	return data ? tagName : null;
}

export async function deleteAllTags(
	c: Context<{ Bindings: Bindings }>,
): Promise<string[]> {
	const allIds = await listKeys(c);
	const deletedIds = await Promise.all(
		allIds.map(async (key) => {
			await c.env.kv_tags.delete(key);
			return key;
		}),
	);
	return deletedIds;
}

async function listKeys(c: Context<{ Bindings: Bindings }>): Promise<string[]> {
	const allIds = (await c.env.kv_tags.list()).keys;
	return allIds.map((key) => key.name);
}

async function listTags(
	c: Context<{ Bindings: Bindings }>,
): Promise<tagResponse> {
	const allKeys = await listKeys(c);
	const allTags: tagResponse = Object.fromEntries(
		await Promise.all(
			allKeys.map(async (key) => {
				const data = await c.env.kv_tags.get(key, "json");
				return [key, data];
			}),
		),
	);
	return allTags;
}
