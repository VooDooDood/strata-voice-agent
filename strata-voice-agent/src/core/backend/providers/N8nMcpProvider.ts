/**
 * N8N MCP Backend Provider
 * Connects to N8N's MCP server to execute workflows
 */

import { IBackendProvider, BackendSettings, Tool } from '../../types';

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content?: Array<{ type: string; text: string }>;
    tools?: Array<{ name: string; description: string }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

export class N8nMcpProvider implements IBackendProvider {
  readonly name = 'N8N MCP';
  
  private url: string = '';
  private mcpToken: string = '';
  private cfClientId: string = '';
  private cfClientSecret: string = '';
  private workflowId: string = '';
  private requestId: number = 1;

  configure(settings: BackendSettings): void {
    this.url = settings.url;
    this.mcpToken = settings.token || '';
    this.cfClientId = settings.cfClientId || '';
    this.cfClientSecret = settings.cfClientSecret || '';
    this.workflowId = settings.workflowId || '';
  }

  async isAvailable(): Promise<boolean> {
    // Only URL and MCP Token are strictly required for direct connection
    return this.url.length > 0 && this.mcpToken.length > 0;
  }

  private async mcpRequest(method: string, params: Record<string, unknown> = {}): Promise<McpResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${this.mcpToken}`,
    };

    // Add Cloudflare headers if present
    if (this.cfClientId && this.cfClientSecret) {
      headers['CF-Access-Client-Id'] = this.cfClientId;
      headers['CF-Access-Client-Secret'] = this.cfClientSecret;
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.requestId++,
        method,
        params,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    // Handle SSE (Server-Sent Events) response format
    // N8N MCP returns: "event: message\ndata: {json}\n\n"
    const text = await response.text();

    // Check if it's SSE format
    if (text.startsWith('event:') || text.includes('\ndata:')) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.substring(5).trim();
          if (jsonStr) {
            return JSON.parse(jsonStr);
          }
        }
      }
      throw new Error('No data found in SSE response');
    }

    // Otherwise treat as plain JSON
    return JSON.parse(text);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[N8N MCP] Testing connection to: ${this.url}`);
      console.log(`[N8N MCP] Client ID: ${this.cfClientId.substring(0, 8)}...`);
      
      const response = await this.mcpRequest('tools/list');
      
      if (response.error) {
        return { success: false, message: response.error.message };
      }
      
      const toolCount = response.result?.tools?.length || 0;
      return { 
        success: true, 
        message: `Connected! Found ${toolCount} tools available.` 
      };
    } catch (error) {
      console.error('[N8N MCP] Connection error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        message: `${errorMsg}\n\nURL: ${this.url}\nCheck: Is the URL reachable from this device?`
      };
    }
  }

  async sendMessage(text: string): Promise<string> {
    try {
      // Execute workflow with chat input format (for chat trigger workflows)
      const response = await this.mcpRequest('tools/call', {
        name: 'execute_workflow',
        arguments: {
          workflowId: this.workflowId,
          inputs: {
            type: 'chat',
            chatInput: text,
          },
        },
      });

      if (response.error) {
        return `Error: ${response.error.message}`;
      }

      // Extract text from the response
      const content = response.result?.content;
      if (content && content.length > 0) {
        const resultText = content[0].text;

        // Try to parse as JSON and extract the AI response
        try {
          const parsed = JSON.parse(resultText);

          // N8N returns execution data - look for the chat output
          if (parsed.result?.runData) {
            // Find the last node's output (usually the AI response)
            const runData = parsed.result.runData;
            const nodeNames = Object.keys(runData);

            // Look for common AI agent output nodes
            for (const nodeName of nodeNames) {
              const nodeData = runData[nodeName];
              if (nodeData && nodeData[0]?.data?.main?.[0]?.[0]?.json) {
                const json = nodeData[0].data.main[0][0].json;
                // Check for output field (common in AI agents)
                if (json.output) {
                  return json.output;
                }
                // Check for text field
                if (json.text) {
                  return json.text;
                }
                // Check for response field
                if (json.response) {
                  return json.response;
                }
              }
            }
          }

          // If we can't find a specific field, return the raw text
          return resultText;
        } catch {
          // If not JSON, return as-is
          return resultText;
        }
      }

      return 'No response received';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async getTools(): Promise<Tool[]> {
    try {
      const response = await this.mcpRequest('tools/list');
      
      if (response.error || !response.result?.tools) {
        return [];
      }

      return response.result.tools.map((t, index) => ({
        id: `tool-${index}`,
        name: t.name,
        description: t.description,
        enabled: true,
      }));
    } catch {
      return [];
    }
  }

  async getWorkflows(): Promise<Array<{ id: string; name: string }>> {
    return this.searchWorkflows();
  }

  async searchWorkflows(): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const response = await this.mcpRequest('tools/call', {
        name: 'search_workflows',
        arguments: {},
      });

      if (response.error) {
        console.error('[N8N MCP] Search workflows error:', response.error);
        return [];
      }

      // Parse workflows from response - format is:
      // content[0].text = '{"data":[{id, name, ...}], "count": N}'
      const content = response.result?.content;
      if (content && content.length > 0) {
        try {
          const parsed = JSON.parse(content[0].text);
          if (parsed.data && Array.isArray(parsed.data)) {
            return parsed.data.map((w: { id: string; name: string; description?: string }) => ({
              id: w.id,
              name: w.name,
              description: w.description,
            }));
          }
        } catch (e) {
          console.error('[N8N MCP] Failed to parse workflows:', e);
        }
      }

      return [];
    } catch (error) {
      console.error('[N8N MCP] Search workflows failed:', error);
      return [];
    }
  }
}

// Singleton instance
export const n8nMcpProvider = new N8nMcpProvider();
