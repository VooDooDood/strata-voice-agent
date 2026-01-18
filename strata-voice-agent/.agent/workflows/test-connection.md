---
description: Test N8N MCP backend connectivity
---

# Test N8N MCP Backend Connection

## Prerequisites

- N8N instance running
- MCP token available
- Network access to N8N endpoint

## Steps

### 1. Check N8N endpoint is reachable

// turbo

```bash
curl -I https://n8n.strata.lab/mcp-server/http
```

Should return HTTP 200 or 401 (auth required).

### 2. Test with authentication (Bearer token)

```bash
curl -X POST https://n8n.strata.lab/mcp-server/http ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_MCP_TOKEN" ^
  -d "{\"jsonrpc\": \"2.0\", \"method\": \"tools/list\", \"id\": 1}"
```

Should return JSON with available tools.

### 3. Test with Cloudflare Access (if applicable)

```bash
curl -X POST https://n8n.strata.lab/mcp-server/http ^
  -H "Content-Type: application/json" ^
  -H "CF-Access-Client-Id: YOUR_CLIENT_ID" ^
  -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" ^
  -H "Authorization: Bearer YOUR_MCP_TOKEN" ^
  -d "{\"jsonrpc\": \"2.0\", \"method\": \"tools/list\", \"id\": 1}"
```

### 4. From Android device (via adb)

```bash
adb shell curl -I https://n8n.strata.lab/mcp-server/http
```

Tests if the phone can reach the endpoint.

## Troubleshooting

| Issue              | Solution                                                   |
| ------------------ | ---------------------------------------------------------- |
| Connection refused | Check N8N is running, firewall allows traffic              |
| SSL error          | Self-signed cert issue—check `network_security_config.xml` |
| 401 Unauthorized   | Token invalid or expired                                   |
| 403 Forbidden      | Cloudflare Access credentials wrong                        |
| Timeout            | Network routing issue, check phone WiFi                    |
