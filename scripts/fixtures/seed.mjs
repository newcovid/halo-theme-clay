/*
  把 content.mjs 里的样张文章灌进本地 Halo，供视觉自测使用。

  幂等：按 slug 找已存在的文章，有就更新正文并重新发布，没有才新建。
  反复跑不会堆出一串重复文章，也不会打乱既有的正式内容——只碰 slug 以 fixture- 开头的那些。

  用法（凭据从环境变量读，不写在仓库里）：
    HALO_USERNAME=… HALO_PASSWORD=… node scripts/fixtures/seed.mjs
    HALO_USERNAME=… HALO_PASSWORD=… node scripts/fixtures/seed.mjs --clean   # 只删，不建

  分类与标签按 slug 复用站上已有的；缺哪个就建哪个。
*/
import { csrfToken, login, req } from "../regression/halo-client.mjs";
import { POSTS } from "./content.mjs";

const CONSOLE = "/apis/api.console.halo.run/v1alpha1";
const CONTENT = "/apis/content.halo.run/v1alpha1";

const CATEGORY_TITLES = { design: "设计", engineering: "工程" };
const TAG_TITLES = { anthropic: "Anthropic", halo: "Halo", typography: "排版" };

async function json(path, init) {
  const res = await req(path, init);
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

function write(path, method, body) {
  return json(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "X-XSRF-TOKEN": csrfToken() },
    method,
  });
}

/** 按 slug 找一个 content.halo.run 资源，没有就按 titles 表建一个，返回 metadata.name */
async function ensureTaxonomy(kind, slug, titles) {
  const list = await json(`${CONTENT}/${kind}`);
  const hit = list.items.find((item) => item.spec.slug === slug);
  if (hit) return hit.metadata.name;

  const created = await write(`${CONTENT}/${kind}`, "POST", {
    apiVersion: "content.halo.run/v1alpha1",
    kind: kind === "categories" ? "Category" : "Tag",
    metadata: { generateName: kind === "categories" ? "category-" : "tag-" },
    spec: { displayName: titles[slug] ?? slug, priority: 0, slug, ...(kind === "categories" ? { children: [] } : {}) },
  });
  console.log(`  + 新建${kind === "categories" ? "分类" : "标签"} ${slug}`);
  return created.metadata.name;
}

async function findBySlug(slug) {
  const list = await json(`${CONSOLE}/posts?size=200`);
  return list.items.find((item) => item.post.spec.slug === slug)?.post;
}

async function removeFixtures() {
  const list = await json(`${CONSOLE}/posts?size=200`);
  const doomed = list.items.filter((item) => item.post.spec.slug.startsWith("fixture-"));
  for (const item of doomed) {
    // recycle 而不是彻底删除：样张是可再生的，但「删」这个动作本身不该是不可逆的
    await write(`${CONSOLE}/posts/${item.post.metadata.name}/recycle`, "PUT", {});
    console.log(`  - 移入回收站 ${item.post.spec.slug}`);
  }
  return doomed.length;
}

async function seed() {
  await login();

  if (process.argv.includes("--clean")) {
    const n = await removeFixtures();
    console.log(`已清理 ${n} 篇样张。`);
    return;
  }

  console.log("准备分类与标签…");
  const categoryIds = {};
  const tagIds = {};
  for (const slug of new Set(POSTS.flatMap((p) => p.categories))) {
    categoryIds[slug] = await ensureTaxonomy("categories", slug, CATEGORY_TITLES);
  }
  for (const slug of new Set(POSTS.flatMap((p) => p.tags))) {
    tagIds[slug] = await ensureTaxonomy("tags", slug, TAG_TITLES);
  }

  for (const item of POSTS) {
    const spec = {
      allowComment: true,
      categories: item.categories.map((s) => categoryIds[s]),
      cover: "",
      deleted: false,
      excerpt: { autoGenerate: false, raw: item.excerpt },
      pinned: false,
      priority: 0,
      publish: true,
      slug: item.slug,
      tags: item.tags.map((s) => tagIds[s]),
      title: item.title,
      visible: "PUBLIC",
    };
    const content = { content: item.content, raw: item.content, rawType: "HTML" };

    const existing = await findBySlug(item.slug);
    if (existing) {
      await write(`${CONTENT}/posts/${existing.metadata.name}`, "PUT", {
        ...existing,
        spec: { ...existing.spec, ...spec },
      });
      await write(`${CONSOLE}/posts/${existing.metadata.name}/content`, "PUT", content);
      await write(`${CONSOLE}/posts/${existing.metadata.name}/publish`, "PUT", {});
      console.log(`  ~ 更新 ${item.slug}`);
    } else {
      const created = await write(`${CONSOLE}/posts`, "POST", {
        content,
        post: {
          apiVersion: "content.halo.run/v1alpha1",
          kind: "Post",
          metadata: { annotations: {}, generateName: "post-" },
          spec,
        },
      });
      await write(`${CONSOLE}/posts/${created.metadata.name}/publish`, "PUT", {});
      console.log(`  + 新建 ${item.slug}`);
    }
  }

  console.log(`\n完成，共 ${POSTS.length} 篇：`);
  for (const item of POSTS) {
    console.log(`  /archives/${item.slug}  ${item.title}`);
  }
}

await seed();
