import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";

const ROOT_DIR = path.resolve("./data");

/**
 * Security guard:
 * Prevents path traversal outside the sandbox directory
 */
function safePath(p: string) {
  const resolved = path.resolve(ROOT_DIR, p);
  if (!resolved.startsWith(ROOT_DIR)) {
    throw new Error("Access denied");
  }
  return resolved;
}

const server = new Server(
  {
    name: "filesystem-server",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * Tool: Read a file
 */
server.tool(
  "read_file",
  {
    path: { type: "string" }
  },
  async ({ path: filePath }) => {
    const fullPath = safePath(filePath);
    const content = await fs.readFile(fullPath, "utf-8");
    return {
      content: [{ type: "text", text: content }]
    };
  }
);

/**
 * Tool: Write a file
 */
server.tool(
  "write_file",
  {
    path: { type: "string" },
    content: { type: "string" }
  },
  async ({ path: filePath, content }) => {
    const fullPath = safePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
    return {
      content: [{ type: "text", text: "File written successfully" }]
    };
  }
);

/**
 * Tool: Search files
 */
server.tool(
  "search_files",
  {
    query: { type: "string" }
  },
  async ({ query }) => {
    const results: string[] = [];

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          const content = await fs.readFile(fullPath, "utf-8");
          if (content.includes(query)) {
            results.push(path.relative(ROOT_DIR, fullPath));
          }
        }
      }
    }

    await walk(ROOT_DIR);

    return {
      content: [
        {
          type: "text",
          text: results.length
            ? results.join("\n")
            : "No matches found"
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
