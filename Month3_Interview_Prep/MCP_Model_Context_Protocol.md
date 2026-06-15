# MCP — Model Context Protocol
## Simple se Technical tak samjho

---

## PART 1: Simple Words mein

### Problem kya tha?

Claude (ya koi bhi LLM) ek **closed box** hai.
Usse kuch pata nahi bahar ki duniya ka:

```
Claude ko pata nahi:
  ❌ Tumhari local files kya hain
  ❌ Tumhara database mein kya data hai
  ❌ GitHub pe kaunsa code hai
  ❌ Slack pe kya messages hain
  ❌ Internet pe abhi kya ho raha hai
```

Har company apna alag integration banati thi — alag code, alag format, alag maintenance. Bahut tedha kaam.

---

### MCP kya solve karta hai?

> **MCP ek universal standard hai — jaise USB-C.**

USB-C se pehle har phone ka charger alag tha.
USB-C aane ke baad — ek cable, sab devices.

MCP same kaam karta hai **AI models aur external tools ke beech**.

```
USB-C se pehle:              MCP se pehle:
  iPhone charger               Claude + GitHub = custom code
  Android charger              Claude + Postgres = alag custom code
  Laptop charger               Claude + Slack = aur alag custom code
  (sab alag alag)              (har integration nayi mehnat)

USB-C ke baad:               MCP ke baad:
  Ek cable                     Claude ←[MCP]→ GitHub Server
  Sab devices                  Claude ←[MCP]→ Postgres Server
  (universal standard)         Claude ←[MCP]→ Slack Server
                               (ek standard, infinite tools)
```

---

### Ek aur analogy — HTTP jaisa

HTTP nahi hota toh har browser ka alag protocol hota.
Chrome sirf Chrome-websites, Firefox sirf Firefox-websites kholta.

HTTP aane ke baad — koi bhi browser, koi bhi website.

**MCP = HTTP for AI tools**

Ek baar MCP Server banao apne tool ka.
Phir koi bhi MCP-compatible AI (Claude, GPT, Gemini) use kar sakta hai.

---

### Real example — samjho practically

**Without MCP:**
```
User: "Meri GitHub repo mein kaunsi open issues hain?"

Claude: "Mujhe pata nahi, main GitHub access nahi kar sakta."
```

**With MCP:**
```
User: "Meri GitHub repo mein kaunsi open issues hain?"

Claude → GitHub MCP Server → GitHub API → issues list laaya
Claude: "Tumhare 5 open issues hain: #123 login bug, #124..."
```

Claude ne khud GitHub API call ki — MCP ki wajah se.

---

## PART 2: Technical Details

### Architecture — 3 Players hain

```
┌──────────────────────────────────────────────────────┐
│                   HOST                               │
│         (Claude Desktop / Claude Code / your app)    │
│                                                      │
│   ┌─────────────────┐                                │
│   │   MCP CLIENT    │  ← AI model yahan baat karta   │
│   │                 │    hai MCP Server se            │
│   └────────┬────────┘                                │
└────────────┼────────────────────────────────────────-┘
             │
             │  Transport Layer
             │  (stdio  OR  HTTP + SSE)
             │
    ┌────────▼──────────────────────┐
    │        MCP SERVER             │
    │   (tumhara tool / data)       │
    │                               │
    │  Expose karta hai 3 cheezein: │
    │  ├── Tools      (functions)   │
    │  ├── Resources  (data/files)  │
    │  └── Prompts    (templates)   │
    └───────────────────────────────┘
```

**Host** = Wo application jisme Claude run ho raha hai (Claude Desktop, Claude Code, ya tumhari app)

**MCP Client** = Host ke andar ka component jo MCP protocol samjhta hai

**MCP Server** = Tumhara tool/data source jo MCP protocol follow karta hai

---

### 3 Core Primitives (MCP Server kya expose karta hai)

#### 1. Tools — Functions jo Claude call kar sakta hai

```python
# MCP Server mein define karte hain
@mcp.tool()
def get_weather(city: str) -> str:
    """Get current weather for a city"""
    # actual weather API call
    return f"Mumbai: 32°C, Humid"

@mcp.tool()
def query_database(sql: str) -> list:
    """Run a SQL query on our database"""
    return db.execute(sql)

@mcp.tool()
def send_slack_message(channel: str, message: str) -> bool:
    """Send a message to Slack"""
    return slack_client.send(channel, message)
```

Claude khud decide karta hai kab kaunsa tool use karna hai.

#### 2. Resources — Data jo Claude read kar sakta hai

```python
# Files, database records, API data — read-only access
@mcp.resource("file:///{path}")
def read_file(path: str) -> str:
    with open(path) as f:
        return f.read()

@mcp.resource("db://users/{user_id}")
def get_user(user_id: str) -> dict:
    return db.query(f"SELECT * FROM users WHERE id={user_id}")
```

Tools = actions (write)
Resources = data (read)

#### 3. Prompts — Reusable prompt templates

```python
@mcp.prompt()
def code_review_prompt(language: str, code: str) -> str:
    return f"""
    Review this {language} code for:
    - Security vulnerabilities
    - Performance issues
    - Best practices
    
    Code: {code}
    """
```

---

### Transport Layer — Communication kaise hoti hai

**Option 1: stdio (Local tools ke liye)**
```
Claude Code → launches MCP server as subprocess
Communication: stdin/stdout pipes
Use case: Local file system, local DB, local tools
Example: filesystem MCP server, sqlite MCP server
```

**Option 2: HTTP + SSE (Remote servers ke liye)**
```
Claude → HTTP POST request → Remote MCP Server
Server → SSE stream → Claude (real-time responses)
Use case: Cloud services, shared team tools
Example: GitHub MCP server, Slack MCP server
```

---

### Protocol — JSON-RPC 2.0

MCP mein sab communication JSON-RPC 2.0 format mein hoti hai.

**Initialization handshake:**
```json
// Client → Server
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": { "name": "claude-code", "version": "1.0" },
    "capabilities": { "tools": {}, "resources": {} }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": { "name": "github-mcp", "version": "1.0" },
    "capabilities": { "tools": { "listChanged": true } }
  }
}
```

**Tool call flow:**
```json
// 1. Client asks: "what tools do you have?"
{ "method": "tools/list" }

// 2. Server responds with available tools
{
  "result": {
    "tools": [{
      "name": "get_issues",
      "description": "Get GitHub issues for a repo",
      "inputSchema": {
        "type": "object",
        "properties": {
          "repo": { "type": "string" },
          "state": { "enum": ["open", "closed"] }
        }
      }
    }]
  }
}

// 3. Client calls a tool
{
  "method": "tools/call",
  "params": {
    "name": "get_issues",
    "arguments": { "repo": "myorg/myrepo", "state": "open" }
  }
}

// 4. Server returns result
{
  "result": {
    "content": [{
      "type": "text",
      "text": "[{\"id\": 123, \"title\": \"Login bug\"}]"
    }]
  }
}
```

---

### Apna MCP Server kaise banate hain?

**Python mein (fastmcp library):**

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("My Custom Server")

@mcp.tool()
def search_products(query: str, max_results: int = 10) -> list:
    """Search products in our catalog"""
    results = product_db.search(query, limit=max_results)
    return [{"id": p.id, "name": p.name, "price": p.price} for p in results]

@mcp.resource("product:///{product_id}")
def get_product(product_id: str) -> dict:
    """Get full product details"""
    return product_db.get(product_id)

if __name__ == "__main__":
    mcp.run()  # stdio transport by default
```

**Claude Code mein register karo:**
```json
// .claude/settings.json
{
  "mcpServers": {
    "my-product-server": {
      "command": "python",
      "args": ["my_mcp_server.py"],
      "env": {
        "DB_URL": "postgresql://localhost/products"
      }
    }
  }
}
```

Ab Claude tumhare products search kar sakta hai directly!

---

### TypeScript mein MCP Server:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool(
  "calculate_revenue",
  "Calculate revenue for a date range",
  {
    startDate: z.string().describe("Start date YYYY-MM-DD"),
    endDate: z.string().describe("End date YYYY-MM-DD"),
  },
  async ({ startDate, endDate }) => {
    const revenue = await db.getRevenue(startDate, endDate);
    return {
      content: [{ type: "text", text: `Revenue: $${revenue.toLocaleString()}` }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

### Popular Ready-Made MCP Servers

Ye sab already bane hain — bas install karo:

```
📁 Filesystem     — local files read/write
🐙 GitHub         — repos, issues, PRs, code
🐘 PostgreSQL     — database queries
🌐 Brave Search   — web search
🔧 Git            — git history, commits, diffs
📊 SQLite         — local database
🖥️  Puppeteer      — browser automation
📧 Gmail          — emails read/send
📅 Google Calendar — events manage
🔔 Slack          — messages send/read
```

---

### MCP vs Function Calling — Difference kya hai?

| Feature | Function Calling | MCP |
|---|---|---|
| Scope | Single LLM API call ke liye | Reusable across apps |
| Standard | OpenAI/Anthropic specific | Open standard (koi bhi implement kare) |
| Discovery | Har call mein functions define karo | Server se automatically discover |
| Transport | API ke through | stdio / HTTP+SSE |
| Reusability | Ek app tak limited | Ek server, infinite clients |
| Ecosystem | Closed | Open — community servers banate hain |

**Simple bolo:** Function calling = temporary tools ek conversation ke liye.
MCP = permanent tools jo koi bhi AI use kar sakti hai.

---

### Security Model

```
Principle: Least Privilege

MCP Server sirf wahi expose karo jo zarurat hai.
Claude ko poora DB access mat do — sirf read-only queries.

┌─────────────────────────────────────┐
│  User approves tool calls           │
│  (Claude Code mein permissions ask  │
│   karta hai pehli baar)             │
└─────────────────────────────────────┘

Isolation:
  Local MCP servers → sandboxed subprocess
  Remote MCP servers → OAuth 2.0 authentication
  All communication → encrypted (TLS for HTTP)

Never expose:
  ❌ Raw filesystem root access
  ❌ Unrestricted shell command execution
  ❌ Admin DB credentials
```

---

### Production mein MCP Deploy karna

**Local development:**
```
Claude Code → subprocess → MCP Server
(stdio transport, fast, simple)
```

**Team shared server:**
```
Claude Code → HTTPS → Remote MCP Server (your cloud)
              OAuth   (HTTP + SSE transport)

Deploy on: AWS Lambda / Cloud Run / Railway
Auth: OAuth 2.0 tokens per user
```

**Enterprise setup:**
```
Multiple MCP servers behind API Gateway:
  /mcp/github    → GitHub MCP Server
  /mcp/postgres  → DB MCP Server
  /mcp/internal  → Internal tools MCP Server

Central auth + audit logging + rate limiting
```

---

## PART 3: Quick Summary — Interview Answer

**Q: MCP kya hai explain karo?**

> MCP (Model Context Protocol) Anthropic ka open standard hai jo AI models ko external tools aur data sources se connect karta hai. Yeh USB-C jaisa hai — ek universal standard jisse koi bhi AI (Claude, GPT, etc.) koi bhi tool use kar sakta hai bina custom integration ke.
>
> Architecture mein 3 parts hain: Host (Claude), MCP Client (Claude ke andar), aur MCP Server (tumhara tool). MCP Server 3 cheezein expose karta hai: Tools (functions jo Claude call kare), Resources (data jo Claude read kare), aur Prompts (reusable templates).
>
> Communication JSON-RPC 2.0 pe hoti hai — ya stdio (local tools) ya HTTP+SSE (remote services) ke through.

---

## Key Numbers / Facts

```
Protocol version:  2024-11-05 (latest)
Communication:     JSON-RPC 2.0
Transports:        stdio  |  HTTP + SSE
3 Primitives:      Tools  |  Resources  |  Prompts
Auth (remote):     OAuth 2.0
Created by:        Anthropic (open-sourced Nov 2024)
Supported by:      Claude, many other AI clients
Community servers: 1000+ on GitHub (mcpservers.org)
```
