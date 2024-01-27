import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

interface Env {
	CMS_API_HOST?: string;
	CMS_API_PORT?: number;
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
	const env = context.env as Env;
	const url = `http://${env.CMS_API_HOST}:${env.CMS_API_PORT}/cms/api/posts`;
	const res = await fetch(new Request(url));
	return await res.json();
};

export default function Index() {
	const res = useLoaderData<typeof loader>();
	return (
		<>
			<h1 className="text-3xl font-bold underline">Hello Blog world!!</h1>
			<ul>
				{Object.entries(res).map(([key, value]) => (
					<li key={key}>{value.title}</li>
				))}
			</ul>
		</>
	);
}
