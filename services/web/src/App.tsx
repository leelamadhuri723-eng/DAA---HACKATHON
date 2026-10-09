import { useEffect, useMemo, useState } from 'react';
import {
  Body1,
  Button,
  Caption1,
  Divider,
  FluentProvider,
  makeStyles,
  Text,
  Title2,
  Title3,
  Toolbar,
  ToolbarButton,
  webLightTheme,
} from '@fluentui/react-components';
import { CircleRegular, DatabaseRegular, ShieldRegular } from '@fluentui/react-icons';
import { api } from './api';
import type { ImpactSummary, NetworkOverview } from './api/types';
import './App.css';

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    background: '#f3f6fb',
    color: '#0f172a',
    padding: '32px',
  },
  shell: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 24px',
    borderRadius: '16px',
    background: '#ffffff',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    border: '1px solid #dbe3ee',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: '#ecfdf5',
    color: '#166534',
    fontWeight: 600,
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.25fr 0.75fr',
    gap: '20px',
    padding: '24px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)',
    color: '#ffffff',
    boxShadow: '0 20px 30px rgba(29, 78, 216, 0.18)',
  },
  heroText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '16px',
    padding: '18px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(360px, 1.5fr)',
    gap: '20px',
  },
  panel: {
    background: '#ffffff',
    borderRadius: '18px',
    border: '1px solid #dbe3ee',
    padding: '20px',
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
  },
  canvasWrap: {
    width: '100%',
    minHeight: '420px',
    borderRadius: '16px',
    border: '1px solid #dbe3ee',
    background: '#f8fbff',
    overflow: 'hidden',
  },
  graphSvg: {
    width: '100%',
    height: '420px',
    display: 'block',
  },
  legend: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
    marginTop: '12px',
    color: '#475569',
    fontSize: '12px',
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #dbe3ee',
    borderRadius: '10px',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f8fbff',
  },
  impactBox: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  partItem: {
    border: '1px solid #dbe3ee',
    borderRadius: '10px',
    background: '#f8fbff',
    padding: '10px 12px',
  },
  tableShell: {
    marginTop: '12px',
  },
});

function App() {
  const styles = useStyles();
  const [health, setHealth] = useState<{ status: string; services: string[] } | null>(null);
  const [network, setNetwork] = useState<NetworkOverview>({
    nodes: [],
    links: [],
    criticalServers: [],
    summary: 'Loading network data…',
  });
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);

  useEffect(() => {
    void api.getHealth().then(setHealth).catch(() => setHealth({ status: 'degraded', services: [] }));
  }, []);

  useEffect(() => {
    void api
      .getNetworkOverview()
      .then((nextNetwork) => {
        setNetwork(nextNetwork);
        setSelectedServer((current) => (current && nextNetwork.criticalServers.includes(current) ? current : nextNetwork.criticalServers[0] ?? null));
      })
      .catch(() => {
        setNetwork({
          nodes: [],
          links: [],
          criticalServers: [],
          summary: 'The network service is unavailable right now.',
        });
        setSelectedServer(null);
      });
  }, []);

  useEffect(() => {
    if (!selectedServer) {
      setImpact(null);
      return;
    }

    void api
      .getImpact(selectedServer)
      .then(setImpact)
      .catch(() => {
        setImpact({
          server: selectedServer,
          parts: [],
          summary: 'Unable to compute impact for the current layout.',
        });
      });
  }, [selectedServer]);

  const rows = useMemo(
    () =>
      network.nodes.map((node) => ({
        server: node.id,
        status: node.status,
        reachability: node.reachability,
        risk: node.risk,
      })),
    [network.nodes],
  );

  const selectedNode = network.nodes.find((node) => node.id === selectedServer) ?? null;

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <ShieldRegular fontSize={28} />
              <div>
                <Title3>Network Failure Detection</Title3>
                <Caption1>Critical server analysis and impact breakdown</Caption1>
              </div>
            </div>
            <div className={styles.statusBadge}>
              <CircleRegular fontSize={12} />
              {health?.status ?? 'checking'}
            </div>
          </header>

          <section className={styles.hero}>
            <div className={styles.heroText}>
              <Caption1 style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                Operational risk overview
              </Caption1>
              <Title2 style={{ margin: 0, color: '#fff' }}>Map service dependencies and isolate the critical failure points.</Title2>
              <Body1 style={{ color: 'rgba(255,255,255,0.88)', maxWidth: '62ch' }}>
                The analysis highlights single-point failures in the network, reveals disconnected service groups, and helps identify where outages could cascade across the environment.
              </Body1>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.statCard}>
                <Caption1 style={{ color: 'rgba(255,255,255,0.72)' }}>Servers</Caption1>
                <Title3 style={{ marginTop: '8px', color: '#fff' }}>{network.nodes.length}</Title3>
              </div>
              <div className={styles.statCard}>
                <Caption1 style={{ color: 'rgba(255,255,255,0.72)' }}>Links</Caption1>
                <Title3 style={{ marginTop: '8px', color: '#fff' }}>{network.links.length}</Title3>
              </div>
              <div className={styles.statCard}>
                <Caption1 style={{ color: 'rgba(255,255,255,0.72)' }}>Critical</Caption1>
                <Title3 style={{ marginTop: '8px', color: '#fff' }}>{network.criticalServers.length}</Title3>
              </div>
            </div>
          </section>

          <div className={styles.mainGrid}>
            <section className={styles.panel}>
              <Toolbar aria-label="Network actions">
                <ToolbarButton icon={<DatabaseRegular />} appearance="subtle" onClick={() => void api.getHealth().then(setHealth)}>
                  Health check
                </ToolbarButton>
              </Toolbar>

              <Text style={{ marginTop: '16px', display: 'block', color: '#475569' }}>{network.summary}</Text>

              <div className={styles.list}>
                <Text style={{ fontWeight: 700 }}>Critical servers</Text>
                {network.criticalServers.length === 0 ? (
                  <Text style={{ color: '#64748b' }}>No single point of failure detected.</Text>
                ) : (
                  network.criticalServers.map((server) => (
                    <div
                      key={server}
                      className={styles.listItem}
                      onClick={() => setSelectedServer(server)}
                      style={selectedServer === server ? { borderColor: '#1d4ed8', background: '#eff6ff' } : undefined}
                    >
                      <Text weight="semibold">{server}</Text>
                      <Button appearance="secondary" size="small">
                        Inspect
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <Text style={{ fontWeight: 700 }}>Network graph</Text>
              <div className={styles.canvasWrap}>
                <svg viewBox="0 0 600 420" className={styles.graphSvg}>
                  {network.links.map((link) => {
                    const from = network.nodes.find((node) => node.id === link.source);
                    const to = network.nodes.find((node) => node.id === link.target);
                    if (!from || !to) return null;
                    const x1 = ((from.x ?? 0.5) * 520) + 40;
                    const y1 = ((from.y ?? 0.5) * 300) + 40;
                    const x2 = ((to.x ?? 0.5) * 520) + 40;
                    const y2 = ((to.y ?? 0.5) * 300) + 40;
                    return <line key={`${link.source}-${link.target}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="2" />;
                  })}

                  {network.nodes.map((node) => {
                    const isSelected = selectedServer === node.id;
                    const cx = ((node.x ?? 0.5) * 520) + 40;
                    const cy = ((node.y ?? 0.5) * 300) + 40;
                    const fill = node.status === 'Critical' ? '#d9534f' : '#8fb8de';
                    const radius = isSelected ? 24 : 18;

                    return (
                      <g key={node.id} onClick={() => setSelectedServer(node.id)} style={{ cursor: 'pointer' }}>
                        <circle cx={cx} cy={cy} r={radius + 8} fill={isSelected ? 'rgba(29,78,216,0.12)' : 'rgba(148,163,184,0.08)'} />
                        <circle cx={cx} cy={cy} r={radius} fill={fill} stroke={isSelected ? '#1d4ed8' : '#ffffff'} strokeWidth={isSelected ? 4 : 2} />
                        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight={700} fill="#ffffff">
                          {node.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className={styles.legend}>
                <span className={styles.legendItem}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#d9534f' }} />Critical server</span>
                <span className={styles.legendItem}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#8fb8de' }} />Safe server</span>
              </div>
            </section>
          </div>

          <div className={styles.mainGrid}>
            <section className={styles.panel}>
              <Text style={{ fontWeight: 700 }}>Impact explorer</Text>
              {impact ? (
                <div className={styles.impactBox}>
                  <Text style={{ color: '#1e293b', fontWeight: 700 }}>{impact.server}</Text>
                  <Text style={{ color: '#475569' }}>{impact.summary}</Text>
                  {impact.parts.length === 0 ? (
                    <Text style={{ color: '#64748b' }}>No disconnected groups calculated.</Text>
                  ) : (
                    impact.parts.map((part) => (
                      <div key={part.label} className={styles.partItem}>
                        <Text weight="semibold">{part.label}</Text>
                        <Text style={{ color: '#475569' }}>{part.servers.join(', ') || 'No servers'}</Text>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <Text style={{ color: '#64748b' }}>Select a critical node to inspect impact.</Text>
              )}
            </section>

            <section className={styles.panel}>
              <Text style={{ fontWeight: 700 }}>Node summary</Text>
              <div className={styles.tableShell}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #dbe3ee' }}>Server</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #dbe3ee' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #dbe3ee' }}>Reachability</th>
                      <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #dbe3ee' }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.server}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{row.server}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{row.status}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{row.reachability}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{row.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <Divider />

          <footer style={{ textAlign: 'center', color: '#64748b', paddingBottom: '12px' }}>
            <Text>{selectedNode ? `Selected focus: ${selectedNode.id}` : 'Select a critical server to inspect its blast radius.'}</Text>
          </footer>
        </div>
      </div>
    </FluentProvider>
  );
}

export default App;
