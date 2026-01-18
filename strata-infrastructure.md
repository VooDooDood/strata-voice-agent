# Strata Infrastructure Reference

Snapshot from strata_3.0 (Jan 2026). This will be replaced once Strata 5.0 is built with GitOps/Flux.

---

## Cluster Overview

- **Type**: 6-node K3s cluster (3 control planes + 3 workers)
- **Networks**: 1 Gig management + 10 Gig internal fabric
- **Ingress**: Traefik at 192.168.0.5 (management) / 192.168.10.5 (internal)
- **DNS**: AdGuard at 192.168.0.217/.218
- **Storage**: NFS from Node 1 (fast-nfs for data, scratch-nfs for cache)

---

## MCP Servers

| Server | URL | Auth | Purpose |
|--------|-----|------|---------|
| **n8n-mcp** | `http://n8n-mcp.lab/mcp` | Bearer `strata-n8n-mcp-auth-token-dev-2025` | Workflow builder (what we use here) |
| **kubernetes-mcp** | `http://kubernetes-mcp.lab/mcp` | None | Cluster operations |
| **mongo-mcp** | `http://mongo-mcp.lab/mcp` | Host header only | MongoDB access |
| **playwright-mcp** | `http://playwright-mcp.lab/mcp` | Basic auth `captain:Voodoochick12!` | Browser automation |
| **git-mcp** | `http://git-mcp.lab/mcp` | None | Git operations |

All MCP servers accessible via Traefik at 192.168.10.5 with Host header.

---

## Databases

### MongoDB
- **Internal**: `mongodb:27017`
- **GUI**: `mongoexpress.lab`
- **Use**: Document storage, lists, research notes
- **Database**: `strata`

### PostgreSQL (with pgvector)
- **Internal**: `postgres-db:5432`
- **GUI**: `pgadmin.lab`
- **Database**: `strata`
- **User**: `strata_admin` (password in K3s secret)
- **Use**: Relational data, vector embeddings, service registry

### Qdrant (Vector DB)
- **Internal**: `qdrant:6333`
- **GUI**: `qdrant.lab/dashboard`
- **Use**: Semantic search, embeddings

### Redis
- **Primary**: `redis-db:6379` (db node)
- **Node 2**: `redis-inf2:6379`
- **Node 3**: `redis-inf3:6379`
- **GUI**: `redisinsight.lab`
- **Use**: Cache, session state

---

## Ollama Instances (LLM Inference)

| Instance | Endpoint | GPU | VRAM | Role |
|----------|----------|-----|------|------|
| **oll1** | `oll1:11434` / `oll1.lab` | RTX 3070 Ti | 8GB | Embeddings, small models |
| **ollama-mega** | `ollama-mega:11434` / `ollmega.lab` | 4x GPUs (2x 3090, 2x 3080 Ti) | 72GB | General pool, big models |
| **oll6** | `oll6:11434` / `oll6.lab` | RTX 3080 | 10GB | Fallback, medium models |

### Ollama API Examples
```bash
# Health check
curl http://oll1:11434/api/tags

# Generate
curl -X POST http://ollama-mega:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral", "prompt": "Hello", "stream": false}'

# Embeddings
curl -X POST http://oll1:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "embeddingemma:300m", "prompt": "Hello world"}'
```

---

## Core Services

| Service | Internal | External | Port | Purpose |
|---------|----------|----------|------|---------|
| **n8n** | `n8n:5678` | `n8n.lab` | 5678 | Workflow orchestration |
| **openwebui** | `openwebui:8080` | `openwebui.lab` | 8080 | Chat UI for Ollama |
| **grafana** | `grafana:3000` | `grafana.lab` | 3000 | Monitoring dashboards |
| **prometheus** | `prometheus:9090` | `prometheus.lab` | 9090 | Metrics |
| **loki** | `loki:3100` | (internal) | 3100 | Log aggregation |

---

## n8n Connection Patterns

### From n8n to Ollama (in-cluster)
```
http://oll1:11434
http://ollama-mega:11434
http://oll6:11434
```

### From n8n to Databases (in-cluster)
```
mongodb://mongodb:27017
postgresql://strata_admin:PASSWORD@postgres-db:5432/strata
redis://redis-db:6379
http://qdrant:6333
```

### Standard Workflow Pattern
```
User Input (Webhook)
  ↓
[Function] Extract intent
  ↓
[Decision] Route to tool
  ├→ MongoDB (lists, documents)
  ├→ Ollama (reasoning, generation)
  ├→ Qdrant (semantic search)
  ├→ Postgres (archive, vectors)
  ↓
[Function] Format response
  ↓
Webhook Response
```

---

## Notes

- Cloudflare removed; everything internal via Traefik
- MCP servers prefer 10 Gig fabric (192.168.10.5) for internal traffic
- Planning Strata 5.0 rebuild with Flux/GitOps
- This doc is a snapshot; infrastructure will change
