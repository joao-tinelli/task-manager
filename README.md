# Task Manager - Aplicação Preparada para Ambientes Orquestrados (Kubernetes)

Este projeto consiste em uma aplicação completa de gerenciamento de tarefas estruturada em microsserviços/contêineres:
1. **Frontend**: Aplicação React com Vite servida via Nginx (Porta 5173 / 80)
2. **Backend**: API REST em Spring Boot com Actuator e conexão JPA (Porta 8080)
3. **Database**: PostgreSQL (Porta 5432)

---

## 🚀 Preparação da Aplicação para Kubernetes

A aplicação foi preparada de acordo com os princípios de aplicações Cloud Native / 12-Factor App para execução em ambientes orquestrados:

### 1. Configuração Externa via Variáveis de Ambiente (Config & Secrets)
- Toda a parametrização do backend (credenciais de banco, host, porta, CORS e timeouts) e do frontend (URL da API) é injetada via variáveis de ambiente.
- Não há dependência fixa de `localhost` para acesso a recursos externos como o banco de dados. No Kubernetes, os nomes dos *Services* (ex: `postgres` ou `postgres-service`) são injetados diretamente em `DB_HOST`.

### 2. Health Checks e Kubernetes Probes (Liveness & Readiness)
O Spring Boot Actuator está configurado com probes ativas para o ciclo de vida do Kubernetes:
- **Liveness Probe** (`/actuator/health/liveness`): Indica se o processo da aplicação está vivo. Se falhar (ex: deadlock), o Kubernetes reinicia o Pod.
- **Readiness Probe** (`/actuator/health/readiness`): Indica se a aplicação está pronta para receber requisições (ex: banco de dados acessível e inicialização concluída). Se falhar ou estiver iniciando, o Kubernetes temporariamente retira o Pod do balanceamento de carga do *Service*.
- **General Health** (`/actuator/health`): Status global da aplicação e de suas dependências.

### 3. Aplicação Stateless e Identificação de Instância (Hostname/Pod)
- O backend é estritamente **stateless** — nenhum estado de sessão ou dados voláteis são mantidos na memória ou no disco local do container. Isso viabiliza escalabilidade horizontal transparente (múltiplas réplicas/Pods em um `Deployment`).
- O endpoint `/api/info` retorna o `hostname` dinâmico do container (correspondente ao nome do Pod no Kubernetes), permitindo auditar e validar o balanceamento de carga entre as réplicas diretamente pela interface do frontend.

### 4. Graceful Shutdown (Encerramento Suave)
- Configurado `server.shutdown=graceful` no Spring Boot com timeout de drenagem configurável via `SHUTDOWN_TIMEOUT` (padrão: 30s).
- Ao receber o sinal `SIGTERM` do Kubernetes (durante *rolling updates*, *drains* ou *scaling down*), o servidor para de aceitar novas requisições e aguarda a conclusão das requisições em trânsito antes do encerramento forçado (`SIGKILL`).
- O `Dockerfile` utiliza a forma exec do `ENTRYPOINT ["java", "-jar", "app.jar"]` para repassar sinais do sistema operacional diretamente para a JVM.

### 5. Frontend Desacoplado e Multi-Ambiente
- A imagem do frontend contém um mecanismo em tempo de execução (`entrypoint.sh`) que injeta a variável `VITE_API_URL` nos artefatos estáticos antes do Nginx iniciar.
- Isso permite reutilizar a **mesma imagem Docker** em múltiplos ambientes (desenvolvimento, staging, produção, Ingress Kubernetes com rota `/api` ou domínios separados) sem necessidade de reconstrução (*rebuild*).

---

## ⚙️ Variáveis de Ambiente Suportadas

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | Host do banco PostgreSQL (nome do Service no K8s) |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `taskmanager` | Nome do banco de dados |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `SERVER_PORT` | `8080` | Porta HTTP do backend Spring Boot |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens permitidas para requisições CORS |
| `SHUTDOWN_TIMEOUT` | `30s` | Tempo limite para encerramento gracioso (*graceful shutdown*) |
| `VITE_API_URL` | `http://localhost:8080/api` | URL base da API REST consumida pelo frontend |

---

## 🛠️ Como Executar Localmente (Docker Compose)

### 1. Iniciar a aplicação
```bash
docker compose up -d
```
> O Docker Compose respeitará a ordem de *Health Check*, aguardando o banco estar pronto antes de iniciar o backend.

### 2. Acessar os serviços
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **Backend Health General:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **Backend Liveness Probe:** [http://localhost:8080/actuator/health/liveness](http://localhost:8080/actuator/health/liveness)
- **Backend Readiness Probe:** [http://localhost:8080/actuator/health/readiness](http://localhost:8080/actuator/health/readiness)
- **Backend Info:** [http://localhost:8080/api/info](http://localhost:8080/api/info)

### 3. Visualizar logs e status
```bash
docker compose ps
docker compose logs -f
```

### 4. Parar a aplicação
```bash
docker compose down
```
Para remover também o volume persistente do banco de dados:
```bash
docker compose down -v
```
