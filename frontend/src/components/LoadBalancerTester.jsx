import { useState } from 'react'

// Paleta de cores para identificar visualmente réplicas diferentes
const POD_COLORS = [
  { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8', badge: '#DBEAFE' }, // Azul
  { bg: '#ECFDF5', border: '#10B981', text: '#047857', badge: '#D1FAE5' }, // Verde
  { bg: '#FFF7ED', border: '#F97316', text: '#C2410C', badge: '#FFEDD5' }, // Laranja
  { bg: '#F5F3FF', border: '#8B5CF6', text: '#6D28D9', badge: '#EDE9FE' }, // Roxo
  { bg: '#FDF2F8', border: '#EC4899', text: '#BE185D', badge: '#FCE7F3' }, // Rosa
  { bg: '#FEFCE8', border: '#EAB308', text: '#A16207', badge: '#FEF9C3' }, // Amarelo
]

function getPodStyle(hostname, hostMap) {
  if (!hostMap.has(hostname)) {
    hostMap.set(hostname, hostMap.size % POD_COLORS.length)
  }
  const colorIndex = hostMap.get(hostname)
  return POD_COLORS[colorIndex]
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function LoadBalancerTester({ apiUrl, onCompleted }) {
  const [numRequests, setNumRequests] = useState(10)
  const [sequential, setSequential] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState([])
  const [hostStats, setHostStats] = useState({})

  const makeRequest = async (reqNum, hostMap, stats) => {
    const startTime = performance.now()
    try {
      // Query param único por requisição para evitar qualquer cache de navegador ou proxy
      const res = await fetch(`${apiUrl}/info?t=${Date.now()}_${reqNum}`, {
        cache: 'no-store',
      })
      const duration = Math.round(performance.now() - startTime)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const hostname = data.hostname || 'Desconhecido'

      const resultItem = {
        reqNum,
        hostname,
        ip: data.ip || '',
        duration,
        success: true,
        style: getPodStyle(hostname, hostMap),
      }

      stats[hostname] = (stats[hostname] || 0) + 1
      return resultItem
    } catch (err) {
      return {
        reqNum,
        hostname: `Erro: ${err.message}`,
        success: false,
        duration: Math.round(performance.now() - startTime),
        style: { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C', badge: '#FEE2E2' },
      }
    }
  }

  const runTest = async () => {
    setIsRunning(true)
    setResults([])
    setHostStats({})

    const hostMap = new Map()
    const stats = {}

    if (sequential) {
      // Modo sequencial: uma requisição por vez, com pequeno intervalo entre elas.
      // Ideal para apresentações — exibe cada resultado em tempo real, linha a linha,
      // tornando o round-robin do kube-proxy facilmente visível.
      const allResults = []
      for (let i = 0; i < numRequests; i++) {
        const item = await makeRequest(i + 1, hostMap, stats)
        allResults.push(item)
        if (item.success) {
          setHostStats({ ...stats })
        }
        setResults([...allResults])
        if (i < numRequests - 1) await sleep(100)
      }
    } else {
      // Modo concorrente: todas as requisições são disparadas ao mesmo tempo.
      // Força múltiplas conexões TCP simultâneas no kube-proxy, maximizando
      // a chance de distribuição entre todos os Pods disponíveis.
      const tempResults = []
      const promises = Array.from({ length: numRequests }, async (_, index) => {
        const item = await makeRequest(index + 1, hostMap, stats)
        tempResults.push(item)
        if (item.success) {
          setHostStats({ ...stats })
        }
        // Atualização incremental: re-renderiza conforme cada requisição chega
        setResults([...tempResults].sort((a, b) => a.reqNum - b.reqNum))
        return item
      })
      await Promise.all(promises)
    }

    setIsRunning(false)
    if (onCompleted) onCompleted()
  }

  const clearResults = () => {
    setResults([])
    setHostStats({})
  }

  const hostEntries = Object.entries(hostStats)
  const totalSuccess = results.filter((r) => r.success).length

  return (
    <div className="card load-balancer-card">
      <div className="lb-header">
        <div>
          <h2>⚖️ Testar balanceamento</h2>
          <p className="lb-subtitle">
            Dispara requisições ao <code>/api/info</code> e exibe quais Pods
            respondem, demonstrando o balanceamento via Kubernetes Service.
          </p>
        </div>
        <div className="lb-actions">
          <label className="lb-select-label">
            Qtd:
            <select
              value={numRequests}
              onChange={(e) => setNumRequests(Number(e.target.value))}
              disabled={isRunning}
              className="lb-select"
            >
              <option value={5}>5 requisições</option>
              <option value={10}>10 requisições</option>
              <option value={15}>15 requisições</option>
              <option value={20}>20 requisições</option>
            </select>
          </label>

          {/* Toggle de modo: sequencial (bom para apresentações) vs concorrente */}
          <label className="lb-mode-toggle" title="Sequencial: uma por vez (bom para apresentações). Concorrente: todas simultâneas (melhor distribuição).">
            <input
              type="checkbox"
              checked={sequential}
              onChange={(e) => setSequential(e.target.checked)}
              disabled={isRunning}
            />
            <span>Sequencial</span>
          </label>

          <button
            className="btn btn-primary"
            onClick={runTest}
            disabled={isRunning}
          >
            {isRunning
              ? sequential
                ? `⏳ Enviando (${results.length}/${numRequests})...`
                : '⏳ Enviando requisições...'
              : '🚀 Testar balanceamento'}
          </button>
          {results.length > 0 && !isRunning && (
            <button className="btn btn-secondary" onClick={clearResults}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Estatísticas resumidas da distribuição de carga */}
      {hostEntries.length > 0 && (
        <div className="lb-stats-container">
          <div className="lb-stats-summary">
            <strong>Resumo do Balanceamento:</strong>{' '}
            {hostEntries.length} réplica(s) responderam a {totalSuccess} requisições com sucesso.
          </div>
          <div className="lb-stats-grid">
            {hostEntries.map(([host, count]) => {
              const percent = Math.round((count / totalSuccess) * 100)
              const style = getPodStyle(host, new Map(hostEntries.map(([h], i) => [h, i])))
              return (
                <div key={host} className="lb-stat-badge">
                  <div className="lb-stat-host">
                    <span
                      className="lb-pod-indicator"
                      style={{ backgroundColor: style.border }}
                    />
                    <code>{host}</code>
                  </div>
                  <div className="lb-stat-count">
                    <strong>{count} reqs</strong> ({percent}%)
                  </div>
                  <div className="lb-progress-bar">
                    <div
                      className="lb-progress-fill"
                      style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${style.border} 0%, ${style.text} 100%)` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lista detalhada das requisições */}
      {results.length > 0 && (
        <div className="lb-results-list">
          <h3>Resultados das Requisições:</h3>
          <div className="lb-log">
            {results.map((r) => (
              <div
                key={r.reqNum}
                className="lb-log-item"
                style={{
                  backgroundColor: r.style.bg,
                  borderColor: r.style.border,
                }}
              >
                <span className="lb-req-tag">Requisição {r.reqNum}</span>
                <span className="lb-arrow">→</span>
                <span
                  className="lb-hostname-tag"
                  style={{ color: r.style.text }}
                >
                  <strong>{r.hostname}</strong>
                  {r.ip && <span className="lb-ip-tag"> ({r.ip})</span>}
                </span>
                <span className="lb-duration">{r.duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
