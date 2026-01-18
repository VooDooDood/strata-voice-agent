---
name: N8N MCP Integration
description: How to integrate with N8N's MCP server via JSON-RPC
---

# N8N MCP Integration

## Overview

N8N exposes an MCP (Model Context Protocol) server that accepts JSON-RPC 2.0 requests over HTTP. This project uses it as the backend for AI processing.

---

## Endpoint

```
https://n8n.strata.lab/mcp-server/http
```

This endpoint is protected by:

1. **Cloudflare Access** (optional, for external access)
2. **MCP Token** (Bearer token authentication)

---

## Authentication

### Option 1: Direct Bearer Token

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <MCP_TOKEN>'
}
```

### Option 2: Cloudflare Access + Bearer Token

```typescript
headers: {
  'Content-Type': 'application/json',
  'CF-Access-Client-Id': '<CLIENT_ID>',
  'CF-Access-Client-Secret': '<CLIENT_SECRET>',
  'Authorization': 'Bearer <MCP_TOKEN>'
}
```

---

## JSON-RPC 2.0 Protocol

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

### Common Methods

| Method         | Purpose                       |
| -------------- | ----------------------------- |
| `tools/list`   | Get available tools/workflows |
| `tools/call`   | Execute a specific tool       |
| `prompts/list` | List available prompts        |

### Example: Call a Tool

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "workflow-name",
    "arguments": {
      "input": "user message here"
    }
  },
  "id": 2
}
```

---

## Implementation in This Project

### Provider Location

`src/core/backend/providers/N8nMcpProvider.ts`

### Key Methods

- `sendMessage(text: string)` — Sends user input to N8N, returns AI response
- `getTools()` — Fetches available workflows from N8N
- `testConnection()` — Validates connectivity and auth

### Settings Storage

- URL: `AsyncStorage` (non-sensitive)
- Token: `SecureStore` (encrypted)
- Selected workflow: `AsyncStorage`

---

## Testing Connection

### From Command Line (Windows)

```powershell
# Test endpoint reachability
curl -I https://n8n.strata.lab/mcp-server/http

# Test with auth
curl -X POST https://n8n.strata.lab/mcp-server/http `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### From Android Device

```bash
adb shell curl -I https://n8n.strata.lab/mcp-server/http
```

---

## Troubleshooting

| Issue            | Cause             | Solution                            |
| ---------------- | ----------------- | ----------------------------------- |
| SSL Error        | Self-signed cert  | Check `network_security_config.xml` |
| 401 Unauthorized | Bad token         | Regenerate MCP token in N8N         |
| 403 Forbidden    | Cloudflare Access | Check CF credentials                |
| Timeout          | Network routing   | Verify device can reach N8N IP      |
| Empty tools list | N8N config        | Enable MCP in N8N workflow settings |
