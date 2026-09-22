# Regras do Projeto (Antigravity Agent) - Task Manager

## Stack e Arquitetura
- **Frontend:** React com Vite servido via Nginx[cite: 1].
- **Backend:** API REST em Spring Boot com Actuator e conexão JPA[cite: 1].
- **Banco de Dados:** PostgreSQL[cite: 1].
- **Design:** Aplicação Cloud Native / 12-Factor App, otimizada para orquestração em Kubernetes[cite: 1].

## Padrões de Código e Aplicação
- **Stateless:** O backend deve ser estritamente *stateless*[cite: 1]. Nenhum estado de sessão ou dado volátil deve ser mantido na memória ou no disco local do container[cite: 1].
- **Configuração Externa:** Toda parametrização (credenciais, hosts, timeouts, CORS) deve obrigatoriamente ser lida a partir de variáveis de ambiente[cite: 1].
- **Health Checks:** O endpoint `/actuator/health` é crítico e deve ser mantido para o funcionamento das *Liveness* e *Readiness Probes*[cite: 1].
- **Graceful Shutdown:** A aplicação deve manter o suporte a encerramento suave (`server.shutdown=graceful`), garantindo o processamento das requisições em trânsito antes do encerramento forçado via `SIGTERM`[cite: 1].

## Comandos do Projeto
- **Rodar ambiente local (Docker Compose):** `docker compose up -d`[cite: 1].
- **Parar ambiente local:** `docker compose down`[cite: 1].
- **Aplicar manifests no Kubernetes:** `kubectl apply -f k8s/`[cite: 1].
- **Testar API/Backend via Kubernetes:** `kubectl port-forward svc/backend 8080:8080`[cite: 1].

## Restrições de Infraestrutura (Kubernetes)
- **Credenciais e Segurança:** NUNCA exponha credenciais (como `DB_USER` e `DB_PASSWORD`) no código-fonte ou nos manifestos de `Deployment`[cite: 1]. Esses valores devem vir exclusivamente de objetos do tipo `Secret` (`secret.yaml`)[cite: 1].
- **Configurações Gerais:** Variáveis não sensíveis (como `DB_HOST` e `SERVER_PORT`) devem ser lidas via `ConfigMap`[cite: 1].
- **Persistência de Dados:** O estado do banco de dados deve ser garantido via `PersistentVolumeClaim` (PVC), não em volumes efêmeros[cite: 1].
- **Recursos (Limits/Requests):** Todo novo container precisa ter definições claras de `resources.requests` e `resources.limits` configuradas nos manifests para evitar o efeito "Noisy Neighbor"[cite: 1].