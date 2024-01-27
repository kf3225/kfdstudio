import { describe, expect, test } from "bun:test";
import app from "./posts";

const testPostData: Record<
	string,
	{
		tags: string[];
		title: string;
		body: string;
		isDraft: boolean;
		updatedAt: number | null;
		createdAt: number;
		entry: { year: string; month: string; day: string };
	}
> = {
	"1704067200000": {
		tags: ["aws", "nodejs"],
		title: "test_title",
		body: "aaaabbbbccc\n",
		isDraft: true,
		updatedAt: null,
		createdAt: 1704067200000,
		entry: { year: "2024", month: "01", day: "01" },
	},
	"1704153600000": {
		tags: ["aws", "nodejs"],
		title: "test_title",
		body: "aaaabbbbccc\n",
		isDraft: true,
		updatedAt: null,
		createdAt: 1704153600000,
		entry: { year: "2024", month: "01", day: "02" },
	},
};
const kv_posts_mock = {
	list: async () => {
		return {
			keys: [{ name: "1704067200000" }, { name: "1704153600000" }],
		};
	},
	get: async (key: string) => {
		return testPostData[key];
	},
	put: async (key: string, data: unknown) => {},
	delete: async (key: string) => {},
};

describe("投稿データAPI", () => {
	test("POST / (作成)", async () => {
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const req = new Request("http://localhost:8787/", {
			method: "POST",
			headers: headers,
			body: JSON.stringify({
				tags: ["aws", "nodejs"],
				title: "test_title",
				body: "aaaabbbbccc\n",
			}),
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		const actual = Object.entries(await res.json<typeof testPostData>())[0][1];
		expect(res.status).toBe(200);
		expect(actual.tags).toEqual(["aws", "nodejs"]);
		expect(actual.body).toEqual("aaaabbbbccc\n");
		expect(actual.title).toEqual("test_title");
		expect(actual.isDraft).toBeTrue();
		expect(actual.updatedAt).toBeNull();
		expect(actual.entry).toEqual({
			year: new Date(actual.createdAt).getFullYear().toString(),
			month: String(new Date(actual.createdAt).getMonth() + 1).padStart(2, "0"),
			day: String(new Date(actual.createdAt).getDate()).padStart(2, "0"),
		});
	});

	test("GET / (全投稿取得)", async () => {
		const req = new Request("http://localhost:8787/", {
			method: "GET",
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(200);
		expect(await res.json<typeof testPostData>()).toEqual(testPostData);
	});

	test("GET / (idによる取得)", async () => {
		const req = new Request("http://localhost:8787/1704067200000", {
			method: "GET",
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(200);
		const expected = Object.fromEntries([Object.entries(testPostData)[0]]);
		expect(await res.json<typeof testPostData>()).toEqual(expected);
	});

	test("GET /:year/:month/:day (投稿日時による取得)", async () => {
		const req = new Request("http://localhost:8787/2024/01/01", {
			method: "GET",
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(200);
		const expected = Object.fromEntries([Object.entries(testPostData)[0]]);
		expect(await res.json<typeof testPostData>()).toEqual(expected);
	});

	test("PATCH / (idによる更新)", async () => {
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const req = new Request("http://localhost:8787/1704067200000", {
			method: "PATCH",
			headers: headers,
			body: JSON.stringify({
				tags: ["aws", "python"],
				title: "updated_title",
				body: "updated\n",
			}),
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		const actual = Object.entries(await res.json<typeof testPostData>())[0][1];
		expect(res.status).toBe(200);
		expect(actual.tags).toEqual(["aws", "python"]);
		expect(actual.body).toEqual("updated\n");
		expect(actual.title).toEqual("updated_title");
		expect(actual.isDraft).toBeTrue();
		expect(actual.entry).toEqual({
			year: new Date(actual.createdAt).getFullYear().toString(),
			month: String(new Date(actual.createdAt).getMonth() + 1).padStart(2, "0"),
			day: String(new Date(actual.createdAt).getDate()).padStart(2, "0"),
		});
	});

	test("PATCH / (存在しないidによる更新)", async () => {
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const req = new Request("http://localhost:8787/1704067212345", {
			method: "PATCH",
			headers: headers,
			body: JSON.stringify({
				tags: ["aws", "python"],
				title: "updated_title",
				body: "updated\n",
			}),
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(204);
		expect(res.body).toBeNull();
	});

	test("DELETE / (全件削除)", async () => {
		const req = new Request("http://localhost:8787/", {
			method: "DELETE",
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(200);
		expect(await res.json<string[]>()).toEqual([
			"1704067200000",
			"1704153600000",
		]);
	});

	test("DELETE /:id (idによる削除)", async () => {
		const req = new Request("http://localhost:8787/1704067200000", {
			method: "DELETE",
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(200);
		expect(await res.json<string>()).toEqual("1704067200000");
	});

	test("DELETE /:id (存在しないidによる削除)", async () => {
		const req = new Request("http://localhost:8787/1704067123456", {
			method: "DELETE",
		});
		const res = await app.fetch(req, {
			kv_posts: kv_posts_mock,
		});
		expect(res.status).toBe(204);
		expect(await res.body).toBeNull();
	});
});
