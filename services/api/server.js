const express = require('express');

const app = express();
const port = process.env.PORT || 3001;

const DEMO_NETWORK_TEXT = `# Sample company network
Gateway Router1
Router1 Web
Router1 App
Web App
Router1 Router2
Router2 DB
Router2 Backup
DB Backup
Router2 Mail
Mail Printer`;

function normalizeLine(raw) {
  return raw.split('#')[0].trim();
}

function buildNetworkFromText(text) {
  const adj = new Map();

  for (const raw of text.split(/\r?\n/)) {
    const line = normalizeLine(raw);
    if (!line) continue;

    const parts = line.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    if (parts.length === 1) {
      if (!adj.has(parts[0])) adj.set(parts[0], new Set());
      continue;
    }
    if (parts.length !== 2) {
      throw new Error(`Bad line (need two server names): '${raw.trim()}'`);
    }

    const [a, b] = parts;
    if (a === b) {
      if (!adj.has(a)) adj.set(a, new Set());
      continue;
    }

    const setA = adj.get(a) ?? new Set();
    const setB = adj.get(b) ?? new Set();
    setA.add(b);
    setB.add(a);
    adj.set(a, setA);
    adj.set(b, setB);
  }

  const servers = Array.from(adj.keys()).sort();
  const links = [];
  for (const [source, targets] of adj.entries()) {
    for (const target of targets) {
      const pair = [source, target].sort();
      const key = `${pair[0]}|${pair[1]}`;
      if (!links.some(([a, b]) => `${a}|${b}` === key)) {
        links.push(pair);
      }
    }
  }

  const criticalServers = findCriticalServers(servers, links);
  const nodePositions = springLayout(servers, links);

  const nodes = servers.map((server) => ({
    id: server,
    status: criticalServers.includes(server) ? 'Critical' : 'Active',
    reachability: criticalServers.includes(server) ? 'Degraded' : 'Healthy',
    risk: criticalServers.includes(server) ? 'High' : 'Low',
    x: nodePositions.get(server)?.x ?? 0.5,
    y: nodePositions.get(server)?.y ?? 0.5,
  }));

  return {
    servers,
    links: links.slice().sort(([a], [b]) => a.localeCompare(b)),
    nodes,
    criticalServers,
  };
}

function findCriticalServers(servers, links) {
  const adjacency = new Map();
  for (const server of servers) adjacency.set(server, new Set());
  for (const [a, b] of links) {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  const disc = new Map();
  const low = new Map();
  const critical = new Set();
  let timer = 0;

  const dfs = (node, parent) => {
    disc.set(node, timer);
    low.set(node, timer);
    timer += 1;
    let children = 0;

    for (const next of adjacency.get(node) ?? []) {
      if (next === parent) continue;
      if (disc.has(next)) {
        low.set(node, Math.min(low.get(node) ?? timer, disc.get(next) ?? timer));
      } else {
        children += 1;
        dfs(next, node);
        low.set(node, Math.min(low.get(node) ?? timer, low.get(next) ?? timer));
        if (parent !== null && (low.get(next) ?? timer) >= (disc.get(node) ?? timer)) {
          critical.add(node);
        }
      }
    }

    if (parent === null && children > 1) {
      critical.add(node);
    }
  };

  for (const server of servers) {
    if (!disc.has(server)) dfs(server, null);
  }

  return Array.from(critical).sort();
}

function springLayout(servers, links) {
  const positions = new Map();
  const nodes = servers.length === 0 ? [] : servers;

  if (nodes.length === 0) return positions;

  const angleGap = (Math.PI * 2) / nodes.length;
  for (let i = 0; i < nodes.length; i += 1) {
    const radius = 0.38;
    positions.set(nodes[i], {
      x: 0.5 + radius * Math.cos(i * angleGap),
      y: 0.5 + radius * Math.sin(i * angleGap),
    });
  }

  const adjacency = new Map();
  for (const server of nodes) adjacency.set(server, new Set());
  for (const [a, b] of links) {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  let temp = 0.12;
  for (let step = 0; step < 220; step += 1) {
    const displacement = new Map();
    for (const server of nodes) displacement.set(server, { x: 0, y: 0 });

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const posA = positions.get(a);
        const posB = positions.get(b);
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const force = (0.4 * 0.4) / distance;
        const pushX = (dx / distance) * force;
        const pushY = (dy / distance) * force;

        displacement.get(a).x += pushX;
        displacement.get(a).y += pushY;
        displacement.get(b).x -= pushX;
        displacement.get(b).y -= pushY;
      }
    }

    for (const [a, b] of links) {
      const posA = positions.get(a);
      const posB = positions.get(b);
      const dx = posA.x - posB.x;
      const dy = posA.y - posB.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const force = (distance * distance) / 0.4;
      displacement.get(a).x -= (dx / distance) * force;
      displacement.get(a).y -= (dy / distance) * force;
      displacement.get(b).x += (dx / distance) * force;
      displacement.get(b).y += (dy / distance) * force;
    }

    for (const server of nodes) {
      const next = displacement.get(server);
      const distance = Math.hypot(next.x, next.y) || 0.001;
      const moveX = (next.x / distance) * Math.min(distance, temp);
      const moveY = (next.y / distance) * Math.min(distance, temp);
      const current = positions.get(server);
      current.x = Math.min(0.98, Math.max(0.02, current.x + moveX));
      current.y = Math.min(0.98, Math.max(0.02, current.y + moveY));
    }

    temp *= 0.985;
  }

  return positions;
}

function buildOverview() {
  const network = buildNetworkFromText(DEMO_NETWORK_TEXT);
  return {
    nodes: network.nodes,
    links: network.links.map(([source, target]) => ({ source, target })),
    criticalServers: network.criticalServers,
    summary: `Servers: ${network.nodes.length} • Links: ${network.links.length} • Critical nodes: ${network.criticalServers.length}`,
  };
}

function calculateImpactSummary(serverName, text) {
  const { servers, links } = buildNetworkFromText(text);
  const adjacency = new Map();
  for (const server of servers) adjacency.set(server, new Set());
  for (const [a, b] of links) {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  const seen = new Set([serverName]);
  const components = [];
  for (const server of servers) {
    if (seen.has(server)) continue;
    const comp = [];
    const stack = [server];
    seen.add(server);
    while (stack.length > 0) {
      const current = stack.pop();
      comp.push(current);
      for (const next of adjacency.get(current) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    components.push(comp.sort());
  }

  const parts = components.map((part, index) => ({
    label: `Part ${index + 1}`,
    servers: part,
  }));

  return {
    server: serverName,
    parts,
    summary: `${serverName} splits the network into ${parts.length} disconnected parts when removed.`,
  };
}

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    services: ['frontend', 'network-analysis-api'],
  });
});

app.get('/api/network-overview', (_req, res) => {
  res.json(buildOverview());
});

app.get('/api/impact', (req, res) => {
  const serverName = String(req.query.serverName || '').trim();

  if (!serverName) {
    return res.status(400).json({ error: 'serverName query string is required.' });
  }

  const network = buildNetworkFromText(DEMO_NETWORK_TEXT);
  if (!network.servers.includes(serverName)) {
    return res.status(404).json({ error: `Unknown server: ${serverName}` });
  }

  return res.json(calculateImpactSummary(serverName, DEMO_NETWORK_TEXT));
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
