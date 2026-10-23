// Minimal stdio MCP client: node tools/mcp/mcp-call.mjs <server-bin> <tool> '<json-args>' | list
import { spawn } from 'node:child_process';
const [bin, tool, args] = process.argv.slice(2);
const p = spawn('npx', [bin], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', id = 0; const wait = {};
p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue; const m = JSON.parse(line); if (m.id != null && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } } });
const rpc = (method, params) => new Promise(r => { const i = ++id; wait[i] = r; p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, method, params }) + '\n'); });
await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'se3d', version: '1' } });
p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
if (tool === 'list') { const r = await rpc('tools/list', {}); console.log(r.result.tools.map(t => t.name + ': ' + JSON.stringify(t.inputSchema.properties)).join('\n')); }
else { const r = await rpc('tools/call', { name: tool, arguments: JSON.parse(args || '{}') }); console.log(r.error ? JSON.stringify(r.error) : r.result.content.map(c => c.text).join('\n')); }
p.kill();
