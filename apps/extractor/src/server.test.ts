import assert from "node:assert/strict";
import test from "node:test";

process.env.EXTRACTOR_SHARED_SECRET = "test-secret";

let buildServerPromise: Promise<
  typeof import("./server")
> | null = null;

const getBuildServer = async () => {
  buildServerPromise ??= import("./server");

  const { buildServer } = await buildServerPromise;

  return buildServer;
};

const createTestServer = async () => {
  const buildServer = await getBuildServer();
  const app = buildServer();
  await app.ready();
  return app;
};

test("GET /healthz is public", async (t) => {
  const app = await createTestServer();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/healthz",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true });
});

test("POST /internal/extract/article requires auth", async (t) => {
  const app = await createTestServer();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/internal/extract/article",
    payload: {
      url: "https://example.com",
    },
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { error: "Unauthorized" });
});

test("POST /internal/extract/article validates the request body", async (t) => {
  const app = await createTestServer();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/internal/extract/article",
    headers: {
      authorization: "Bearer test-secret",
    },
    payload: {
      timeoutMs: -1,
    },
  });

  assert.equal(response.statusCode, 400);

  const body = response.json();
  assert.equal(body.error, "Invalid request body");
  assert.ok(body.details);
});

test("POST /internal/extract/article returns the stub response", async (t) => {
  const app = await createTestServer();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/internal/extract/article",
    headers: {
      authorization: "Bearer test-secret",
    },
    payload: {
      url: "https://example.com",
    },
  });

  assert.equal(response.statusCode, 501);
  assert.deepEqual(response.json(), {
    status: "error",
    errorCode: "NOT_IMPLEMENTED",
    errorMessage: "Extractor route not implemented yet",
  });
});
