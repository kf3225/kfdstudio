import dayjs from "dayjs";
import { Context } from "hono";
import { z } from "zod";
import { Bindings } from "../bindings";
import { postSchema } from "../schema";

type postResponse = Record<string, z.infer<typeof postSchema>>;

export async function getAllPosts(c: Context<{ Bindings: Bindings }>) {
	const allPosts = await listPosts(c);
	return allPosts;
}

export async function getPostById(
	c: Context<{ Bindings: Bindings }>,
): Promise<postResponse | null> {
	const id = c.req.param("id");
	const res = await c.env.kv_posts.get<z.infer<typeof postSchema>>(id);
	if (!res) {
		return null;
	}
	return { [id]: res };
}

export async function getPostsByEntry(
	c: Context<{ Bindings: Bindings }>,
): Promise<postResponse> {
	const year = c.req.param("year");
	const month = c.req.param("month");
	const day = c.req.param("day");
	const allPosts = await listPosts(c);
	const targetPosts = Object.fromEntries(
		Object.entries(allPosts).filter(
			([_, value]) =>
				value.entry?.year === year &&
				value.entry?.month === month &&
				value.entry?.day === day,
		),
	);
	return targetPosts;
}

export async function updatePostById(
	c: Context<{ Bindings: Bindings }>,
	data: z.infer<typeof postSchema>,
): Promise<postResponse | null> {
	const id = c.req.param("id");
	const res = await c.env.kv_posts.get<z.infer<typeof postSchema>>(id);
	const now = dayjs();
	if (res) {
		const payload = { ...res, ...data, updatedAt: now.valueOf() };
		await c.env.kv_posts.put(id, JSON.stringify(payload));
		return { [id]: payload };
	}
	return null;
}

export async function getPostsByTag(
	c: Context<{ Bindings: Bindings }>,
): Promise<postResponse> {
	const allPosts = await listPosts(c);
	const targetTags = c.req.queries("tags") || [];
	const filterdPosts = Object.fromEntries(
		Object.entries(allPosts).filter(([_, value]) =>
			value.tags.every((tag) => targetTags.includes(tag)),
		),
	);
	return filterdPosts;
}

export async function createPost(
	c: Context<{ Bindings: Bindings }>,
	data: z.infer<typeof postSchema>,
): Promise<postResponse> {
	const now = dayjs();
	const id = now.valueOf().toString();
	const entry = {
		year: now.format("YYYY"),
		month: now.format("MM"),
		day: now.format("DD"),
	};
	const payload = {
		...data,
		createdAt: now.valueOf(),
		entry: entry,
		updatedAt: null,
	};
	await c.env.kv_posts.put(id, JSON.stringify(payload));

	return { [id]: payload };
}

export async function deletePostById(
	c: Context<{ Bindings: Bindings }>,
): Promise<string | null> {
	const targetId = c.req.param("id");
	const data = await c.env.kv_posts.get(targetId);
	if (data) {
		await c.env.kv_posts.delete(targetId);
	}
	return data ? targetId : null;
}

export async function deleteAllPosts(
	c: Context<{ Bindings: Bindings }>,
): Promise<string[]> {
	const allIds = await listKeys(c);
	const deletedIds = await Promise.all(
		allIds.map(async (key) => {
			await c.env.kv_posts.delete(key);
			return key;
		}),
	);
	return deletedIds;
}

async function listKeys(c: Context<{ Bindings: Bindings }>): Promise<string[]> {
	const allIds = (await c.env.kv_posts.list()).keys;
	return allIds.map((key) => key.name);
}

async function listPosts(
	c: Context<{ Bindings: Bindings }>,
): Promise<postResponse> {
	const allKeys = await listKeys(c);
	const allPosts = Object.fromEntries(
		await Promise.all(
			allKeys.map(async (key) => {
				const data = await c.env.kv_posts.get<z.infer<typeof postSchema>>(
					key,
					"json",
				);
				return [key, data];
			}),
		),
	);
	return allPosts;
}
