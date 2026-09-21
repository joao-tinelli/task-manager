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
- Não há dependência fixa de `localhost` para acesso a recursos externos como o banco de dados. No Kubernetes, os nomes dos *Services* (ex: `postgres`) são injetados diretamente em `DB_HOST`.

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

## 📚 Conceitos Fundamentais de Kubernetes: ConfigMap vs Secret vs PersistentVolumeClaim

No Kubernetes, recursos de configuração, segurança e armazenamento são desacoplados do ciclo de vida dos contêineres e imagens Docker:

### 1. ConfigMap (`configmap.yaml`)
* **O que é:** Um objeto de API usado para armazenar dados de configuração **não confidenciais** em pares de chave-valor.
* **Finalidade:** Desacoplar a configuração dos artefatos de build (imagens Docker), permitindo que a mesma imagem seja implantada em múltiplos ambientes (dev, staging, prod) apenas alterando os valores do ConfigMap.
* **Uso no Projeto:** Armazena configurações como `DB_HOST`, `DB_PORT`, `DB_NAME`, `SERVER_PORT`, `CORS_ALLOWED_ORIGINS` e `SHUTDOWN_TIMEOUT`.
* **Como os Pods consomem:** Injetado como variáveis de ambiente no container via `configMapKeyRef` (ou montado como arquivos de volume).

### 2. Secret (`secret.yaml`)
* **O que é:** Um objeto de API destinado especificamente ao armazenamento e gerenciamento de informações **sensíveis e confidenciais** (como senhas, tokens OAuth, chaves SSH e certificados).
* **Finalidade:** Evitar que credenciais e dados críticos fiquem expostos no código-fonte, nos manifests de Deployments ou nos históricos de commits. No Kubernetes, Secrets podem ter controle de acesso granular via RBAC e criptografia em repouso no *etcd*.
* **Uso no Projeto:** Armazena com segurança o usuário e senha do banco de dados (`DB_USER` e `DB_PASSWORD`), consumidos tanto pelo PostgreSQL quanto pelo Backend sem expor os valores nos manifestos de `Deployment`.
* **Como os Pods consomem:** Injetado como variáveis de ambiente via `secretKeyRef` (ou montado como volumes em tmpfs).

### 3. PersistentVolumeClaim - PVC (`postgres-pvc.yaml`)
* **O que é:** Uma **solicitação de armazenamento** (claim) feita por um usuário ou Pod. Funciona como um "pedido" que especifica tamanho (ex: 1Gi) e modos de acesso (ex: `ReadWriteOnce`).
* **Finalidade:** Fornecer armazenamento persistente e durável que **sobrevive ao ciclo de vida dos Pods**. Por padrão, o sistema de arquivos de um container é efêmero (se o Pod morrer ou for recriado, os dados locais são perdidos). O PVC desacopla o armazenamento do Pod, garantindo a integridade dos dados de bancos relacionais ou stateful workloads.
* **Uso no Projeto:** Vinculado ao Deployment do PostgreSQL para persistir o diretório `/var/lib/postgresql/data`. Se o Pod do PostgreSQL for reiniciado, escalado ou recriado durante uma atualização, todos os registros e tabelas permanecem intactos.

---

### 🔍 Resumo Comparativo

| Recurso | Tipo de Dado | Sensibilidade | Persistência / Ciclo de Vida | Exemplo no Projeto |
| :--- | :--- | :--- | :--- | :--- |
| **ConfigMap** | Configurações textuais / Chave-Valor | Não confidencial | Independente do Pod (gerenciado no cluster) | `DB_HOST`, `DB_PORT`, `DB_NAME` |
| **Secret** | Credenciais, chaves, senhas | Altamente confidencial | Independente do Pod (gerenciado com RBAC/criptografia) | `DB_USER`, `DB_PASSWORD` |
| **PVC** | Armazenamento em bloco / arquivos | Dados de estado da aplicação | Persistente (sobrevive à recriação e exclusão de Pods) | `/var/lib/postgresql/data` (PostgreSQL) |

---

## ⚙️ Variáveis de Ambiente Suportadas

| Variável | Origem no K8s | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `DB_HOST` | `ConfigMap` | `postgres` | Host do banco PostgreSQL (nome do Service K8s) |
| `DB_PORT` | `ConfigMap` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `ConfigMap` | `taskmanager` | Nome do banco de dados |
| `DB_USER` | `Secret` | `postgres` | Usuário autenticado do banco |
| `DB_PASSWORD` | `Secret` | `postgres` | Senha autenticada do banco |
| `SERVER_PORT` | `ConfigMap` | `8080` | Porta HTTP do backend Spring Boot |
| `CORS_ALLOWED_ORIGINS` | `ConfigMap` | `*` | Origens permitidas para requisições CORS |
| `SHUTDOWN_TIMEOUT` | `ConfigMap` | `30s` | Tempo limite para encerramento gracioso (*graceful shutdown*) |
| `VITE_API_URL` | Container Env | `http://localhost:8080/api` | URL base da API REST consumida pelo frontend |

---

## ☸️ Como Executar no Kubernetes

### Estrutura dos Manifestos (`k8s/`)

```
k8s/
├── configmap.yaml            # Configurações não sensíveis (DB_HOST, DB_PORT, DB_NAME, etc.)
├── secret.yaml               # Credenciais sensíveis (DB_USER, DB_PASSWORD)
├── postgres-pvc.yaml         # PersistentVolumeClaim para dados do PostgreSQL
├── postgres-deployment.yaml  # Deployment do PostgreSQL com volume e envs injetadas
├── postgres-service.yaml     # Service ClusterIP para o PostgreSQL (porta 5432)
├── backend-deployment.yaml   # Deployment do Backend consumindo ConfigMap e Secret
├── backend-service.yaml      # Service ClusterIP para o Backend (porta 8080)
├── frontend-deployment.yaml  # Deployment do Frontend React Nginx
└── frontend-service.yaml     # Service NodePort para o Frontend (porta 30080)
```

### 1. Aplicar os manifestos no Cluster

```bash
# Aplicar todos os recursos na ordem correta
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Ou aplicar o diretório completo de uma vez:
kubectl apply -f k8s/
```

### 2. Verificar o status dos recursos

```bash
# Visualizar Pods, Services, PVCs, ConfigMaps e Secrets
kubectl get pods
kubectl get services
kubectl get pvc
kubectl get configmap taskmanager-config
kubectl get secret taskmanager-secret
```

### 3. Acessar a aplicação no Kubernetes

* **Frontend:** Porta NodePort [http://localhost:30080](http://localhost:30080) (ou via `minikube service frontend` se estiver usando Minikube)
* **Backend API (via port-forward):**
  ```bash
  kubectl port-forward svc/backend 8080:8080
  ```
  Acesso: [http://localhost:8080/api/tasks](http://localhost:8080/api/tasks) e [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

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
