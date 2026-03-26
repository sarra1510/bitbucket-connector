import * as http from "http";
import * as path from "path";
import * as dotenv from "dotenv";
import { BitbucketClient } from "@bitbucket-connector/core";
import { BitbucketSkills } from "./skills";
import { BitbucketAgent } from "./agent";

// Load .env from repo root
const envPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });

const {
  BB_BASE_URL,
  BB_USER = "",
  BB_TOKEN,
  BB_PASSWORD,
  BB_PROJECT = "",
  BB_REPO = "",
  PORT = "3000",
} = process.env;

if (!BB_BASE_URL || !BB_PROJECT || !BB_REPO) {
  console.error("❌ Missing required env vars: BB_BASE_URL, BB_PROJECT, BB_REPO");
  process.exit(1);
}

const client = new BitbucketClient({
  baseUrl: BB_BASE_URL,
  user: BB_USER,
  token: BB_TOKEN,
  password: BB_PASSWORD,
  project: BB_PROJECT,
  repo: BB_REPO,
});

const skills = new BitbucketSkills(client);
const agent = new BitbucketAgent(skills);

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "Bitbucket Copilot Extension",
        repo: `${BB_PROJECT}/${BB_REPO}`,
        version: "1.0.0",
      })
    );
    return;
  }

  if (req.method === "POST" && req.url === "/agent") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const messages: { role: string; content: string }[] = payload.messages || [];
        const lastUser = [...messages]
          .reverse()
          .find((m) => m.role === "user");

        const userMessage = lastUser?.content || "";
        const reply = await agent.handleMessage(userMessage);

        // SSE streaming response in Copilot format
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        const data = JSON.stringify({
          choices: [
            {
              delta: { role: "assistant", content: reply },
              finish_reason: "stop",
              index: 0,
            },
          ],
        });

        res.write(`data: ${data}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(parseInt(PORT, 10), () => {
  console.log(`🚀 Bitbucket Copilot Extension running on port ${PORT}`);
  console.log(`   Repo: ${BB_PROJECT}/${BB_REPO} @ ${BB_BASE_URL}`);
});
