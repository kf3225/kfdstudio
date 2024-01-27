import { describe, expect, test } from "bun:test";
import app from "./tags";

const testTagsData: Record<
	string,
	{
		relatedTags: string[];
		updatedAt: number | null;
		createdAt: number;
	}
> = {
	python: {
		relatedTags: ["aws", "AI"],
		createdAt: 1704067200000,
		updatedAt: null,
	},
	nodejs: {
		relatedTags: ["aws", "Frontend"],
		createdAt: 1704067200000,
		updatedAt: null,
	},
};
const kv_tags_mock = {
	list: async () => {
		return {
			keys: [{ name: "python" }, { name: "nodejs" }],
		};
	},
	get: async (key: string) => {
		return testTagsData[key];
	},
	put: async (key: string, data: unknown) => {},
	delete: async (key: string) => {},
};

describe("タグAPI", () => {
	test("POST / (作成)", async () => {
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const req = new Request("http://localhost:8787/python", {
			method: "POST",
			headers: headers,
			body: JSON.stringify({
				relatedTags: ["aws", "AI"],
			}),
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		const actual = Object.entries(await res.json<typeof testTagsData>())[0][1];
		expect(res.status).toBe(200);
		expect(actual.relatedTags).toEqual(["aws", "AI"]);
		expect(actual.updatedAt).toBeNull();
	});

	test("GET / (全タグ取得)", async () => {
		const req = new Request("http://localhost:8787/", {
			method: "GET",
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		expect(res.status).toBe(200);
		expect(await res.json<typeof testTagsData>()).toEqual(testTagsData);
	});

	test("GET /:name (タグ名による取得)", async () => {
		const req = new Request("http://localhost:8787/python", {
			method: "GET",
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		expect(res.status).toBe(200);
		const expected = Object.fromEntries([Object.entries(testTagsData)[0]]);
		expect(await res.json<typeof testTagsData>()).toEqual(expected);
	});

	test("PATCH / (タグ名による更新)", async () => {
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const req = new Request("http://localhost:8787/python", {
			method: "PATCH",
			headers: headers,
			body: JSON.stringify({
				relatedTags: ["aws", "AI", "ETL"],
			}),
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		const actual = Object.entries(await res.json<typeof testTagsData>())[0][1];
		expect(res.status).toBe(200);
		expect(actual.relatedTags).toEqual(["aws", "AI", "ETL"]);
		expect(actual.updatedAt).not.toBeNull();
	});

	test("PATCH / (存在しないタグ名による更新)", async () => {
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const req = new Request("http://localhost:8787/azure", {
			method: "PATCH",
			headers: headers,
			body: JSON.stringify({
				relatedTags: ["aws", "AI", "ETL"],
			}),
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		expect(res.status).toBe(204);
		expect(res.body).toBeNull();
	});

	test("DELETE / (全件削除)", async () => {
		const req = new Request("http://localhost:8787/", {
			method: "DELETE",
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		expect(res.status).toBe(200);
		expect(await res.json<{ deletedTags: string[] }>()).toEqual({
			deletedTags: ["python", "nodejs"],
		});
	});

	test("DELETE /:name (タグ名による削除)", async () => {
		const req = new Request("http://localhost:8787/python", {
			method: "DELETE",
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		expect(res.status).toBe(200);
		expect(await res.json<{ deletedTag: string }>()).toEqual({
			deletedTag: "python",
		});
	});

	test("DELETE /:name (存在しないタグ名による削除)", async () => {
		const req = new Request("http://localhost:8787/azure", {
			method: "DELETE",
		});
		const res = await app.fetch(req, {
			kv_tags: kv_tags_mock,
		});
		expect(res.status).toBe(204);
		expect(res.body).toBeNull();
	});
});
