# Task Manager - Documentação do Projeto e Roteiro Acadêmico

> **Aplicação Cloud-Native de Gerenciamento de Tarefas**  
> Evolução de uma arquitetura tradicional para contêineres e orquestração moderna com **Docker**, **Docker Compose** e **Kubernetes**.

---

## 📑 Sumário

1. [Visão Geral e Evolução Tecnológica](#1-visão-geral-e-evolução-tecnológica)
   - [1. Spring Boot (Backend API)](#11-spring-boot-backend-api)
   - [2. PostgreSQL (Camada de Persistência)](#12-postgresql-camada-de-persistência)
   - [3. React (Frontend SPA)](#13-react-frontend-spa)
   - [4. Docker (Conteinerização)](#14-docker-conteinerização)
   - [5. Docker Compose (Orquestração Local Multicontêiner)](#15-docker-compose-orquestração-local-multicontêiner)
   - [6. Kubernetes (Orquestração em Nuvem / Produção)](#16-kubernetes-orquestração-em-nuvem--produção)
2. [Diagrama da Arquitetura](#2-diagrama-da-arquitetura)
3. [Conceitos Fundamentais Didáticos](#3-conceitos-fundamentais-didáticos)
   - [Container vs Pod](#31-container-vs-pod)
   - [Deployment e ReplicaSet](#32-deployment-e-replicaset)
   - [Service (ClusterIP vs NodePort)](#33-service-clusterip-vs-nodeport)
   - [ConfigMap vs Secret vs PersistentVolumeClaim (PVC)](#34-configmap-vs-secret-vs-persistentvolumeclaim-pvc)
   - [Health Probes: Startup, Liveness e Readiness](#35-health-probes-startup-liveness-e-readiness)
   - [Gerenciamento de Recursos: Requests vs Limits](#36-gerenciamento-de-recursos-requests-vs-limits)
4. [Desenvolvimento Local (Sem Docker)](#4-desenvolvimento-local-sem-docker)
   - [Executando o Backend](#41-executando-o-backend)
   - [Executando o Frontend](#42-executando-o-frontend)
5. [Construção das Imagens Docker](#5-construção-das-imagens-docker)
6. [Execução com Docker Compose](#6-execução-com-docker-compose)
7. [Guia de Operação no Kubernetes](#7-guia-de-operação-no-kubernetes)
   - [Criar o Namespace](#71-criar-o-namespace)
   - [Aplicar os Manifests](#72-aplicar-os-manifests)
   - [Verificar Pods, Deployments e Services](#73-verificar-pods-deployments-e-services)
   - [Visualizar Logs](#74-visualizar-logs)
   - [Acessar a Aplicação](#75-acessar-a-aplicação)
   - [Escalar o Backend](#76-escalar-o-backend)
   - [Testar o Balanceamento de Carga](#77-testar-o-balanceamento-de-carga)
   - [Excluir um Pod e Observar Auto-Healing](#78-excluir-um-pod-e-observar-auto-healing)
   - [Realizar um Rolling Update (Zero Downtime)](#79-realizar-um-rolling-update-zero-downtime)
8. [Demonstração Sugerida (Roteiro para Apresentação Acadêmica)](#8-demonstração-sugerida-roteiro-para-apresentação-acadêmica)
9. [Auditoria e Boas Práticas do Projeto](#9-auditoria-e-boas-práticas-do-projeto)

---

## 1. Visão Geral e Evolução Tecnológica

Este projeto foi construído para servir tanto como uma aplicação funcional de gerenciamento de tarefas quanto como um estudo de caso prático para ensino de engenharia de software moderna e computação em nuvem. A jornada do software reflete as 6 fases fundamentais de maturidade de infraestrutura e arquitetura:

```
  [1. Spring Boot]  ──►  [2. PostgreSQL]  ──►  [3. React]
         │                       │                 │
         └───────────────────────┴─────────────────┘
                                 │
                     [4. Docker (Containers)]
                                 │
                     [5. Docker Compose (Local)]
                                 │
                     [6. Kubernetes (Orquestrado)]
```

### 1.1 Spring Boot (Backend API)
* **Papel:** API REST desenvolvida em Java 21 com Spring Boot 4.
* **Características:**
  * **Estritamente Stateless:** Nenhum estado de sessão ou dado volátil é salvo em memória ou em arquivos locais da instância. Todas as operações transitam via DTOs e são delegadas ao banco relacional. Isso é pré-requisito mandatório para escalabilidade horizontal.
  * **Spring Data JPA & Hibernate:** Mapeamento objeto-relacional para persistência dos dados da entidade `Task`.
  * **Spring Boot Actuator:** Expõe métricas operacionais e endpoints de integridade (`/actuator/health`, `/actuator/info`) cruciais para que ferramentas de monitoramento e orquestradores saibam o estado real do processo.
  * **Encerramento Suave (*Graceful Shutdown*):** Configurado com `server.shutdown=graceful` para drenar requisições em trânsito antes de terminar o processo.
  * **Identificação de Instância:** O endpoint `GET /api/info` expõe o `hostname` do sistema operacional. No Kubernetes, o `hostname` do container é o próprio nome do Pod, permitindo auditar visualmente qual réplica atendeu cada requisição.

### 1.2 PostgreSQL (Camada de Persistência)
* **Papel:** Sistema de Gerenciamento de Banco de Dados Relacional (SGBD).
* **Características:**
  * Garante propriedades ACID (Atomicidade, Consistência, Isolamento e Durabilidade).
  * Centraliza todo o estado dos dados, permitindo que dezenas de réplicas de backend acessem e alterem as tarefas concorrentemente sem conflito de integridade.
  * Configurado para isolamento total: usuário, senha e banco são dinâmicos via variáveis de ambiente.

### 1.3 React (Frontend SPA)
* **Papel:** Interface com o usuário (*Single Page Application* - SPA) construída com React 18 e Vite.
* **Características:**
  * Renderização moderna e reativa no cliente.
  * Fornece um painel interativo de gerenciamento de tarefas (CRUD completo) e uma ferramenta visual exclusiva para auditoria de balanceamento de carga (`LoadBalancerTester`), disparando requisições sequenciais ou concorrentes e colorindo as respostas de acordo com o Pod de origem.
  * **Multi-Ambiente Dinâmico:** Utiliza injeção em runtime via script de entrypoint no Nginx, permitindo que a mesma imagem Docker seja executada em desenvolvimento local, no Docker Compose ou no Kubernetes (com proxy reverso) sem necessidade de recompilação (*rebuild*).

### 1.4 Docker (Conteinerização)
* **Papel:** Empacotamento das aplicações e de suas dependências em imagens padronizadas e imutáveis.
* **Benefícios:**
  * Elimina o clássico problema *"na minha máquina funciona"*.
  * **Multi-Stage Builds:**
    * No backend, o JDK compila o JAR em um estágio e gera uma imagem final mínima baseada em JRE Alpine (`eclipse-temurin:21-jre-alpine`), reduzindo a superfície de ataque e o tempo de download.
    * No frontend, o Node 18 compila os artefatos estáticos (HTML/CSS/JS) e a imagem final utiliza apenas um servidor web Nginx Alpine ultraleve (`nginx:alpine`).
  * Segurança: O container backend executa com usuário não-root dedicado (`spring`).

### 1.5 Docker Compose (Orquestração Local Multicontêiner)
* **Papel:** Definição e execução declarativa de ambientes multicontêiner para produtividade em desenvolvimento.
* **Benefícios:**
  * Um único arquivo (`docker-compose.yml`) descreve os três serviços (`postgres`, `backend`, `frontend`), portas, volumes e redes virtuais compartilhadas.
  * **Controle de Dependências com Health Checks:** O backend só inicia após o PostgreSQL passar no teste `pg_isready` (`condition: service_healthy`), e o frontend só sobe quando o backend responde positivamente ao `/actuator/health`.
  * Criação automática de redes internas com resolução de nomes por DNS integrado (ex: `DB_HOST=postgres`).

### 1.6 Kubernetes (Orquestração em Nuvem / Produção)
* **Papel:** Plataforma de orquestração de contêineres em escala distribuída.
* **Benefícios sobre o Docker simples:**
  * **Auto-Recuperação (*Self-Healing*):** Se um Pod falha ou trava, o Kubernetes o detecta via sondas de saúde e recria um substituto automaticamente.
  * **Escalabilidade Elástica:** Capacidade de escalar réplicas de 1 para 10 ou 100 com um único comando declarativo (`kubectl scale`).
  * **Balanceamento de Carga Nativo:** O objeto `Service` distribui o tráfego via `kube-proxy` e endpoints saudáveis.
  * **Desacoplamento e Segurança:** Configurações via `ConfigMap`, credenciais criptografadas via `Secret` e armazenamento independente do ciclo de vida dos nós via `PersistentVolumeClaim` (PVC).
  * **Zero Downtime:** Atualizações graduais (*Rolling Updates*) sem indisponibilidade para o usuário final.

---

## 2. Diagrama da Arquitetura

O diagrama abaixo ilustra o fluxo de requisições, o roteamento de rede e a persistência no cluster Kubernetes:

```
                              [ USUÁRIO / NAVEGADOR ]
                                         │
                         Requisições HTTP (Porta 30080)
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │ NodePort Service (80)  │  (frontend-service)
                            └───────────┬────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │      Pod Frontend      │  (React + Nginx)
                            │   [taskmanager-app]    │
                            └───────────┬────────────┘
                                        │
                     Proxy Reverso Nginx para rotas /api/*
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │   Service ClusterIP    │  (backend-service:8080)
                            │     [kube-proxy]       │
                            └───────┬───┬───┬────────┘
                                    │   │   │
        ┌───────────────────────────┘   │   └───────────────────────────┐
        ▼ Round-Robin                   ▼ Round-Robin                   ▼ Round-Robin
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│     Pod Backend 1    │    │     Pod Backend 2    │    │     Pod Backend 3    │
│  (Spring Boot JVM)   │    │  (Spring Boot JVM)   │    │  (Spring Boot JVM)   │
│  hostname: bk-xxx-1  │    │  hostname: bk-xxx-2  │    │  hostname: bk-xxx-3  │
└──────────┬───────────┘    └──────────┬───────────┘    └──────────┬───────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                      Conexão JDBC (Porta 5432 / TCP)
                                       │
                                       ▼
                            ┌────────────────────────┐
                            │   Service ClusterIP    │  (postgres-service:5432)
                            └───────────┬────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │      Pod Postgres      │  (PostgreSQL 15 Alpine)
                            │    [Stateful Data]     │
                            └───────────┬────────────┘
                                        │
                                 Volume Mount
                            (/var/lib/postgresql/data)
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │ PersistentVolumeClaim  │  (postgres-pvc: 1Gi)
                            └────────────────────────┘
```

---

## 3. Conceitos Fundamentais Didáticos

Para compreensão completa da orquestração de contêineres, esta seção consolida os 12 conceitos mais importantes do ecossistema:

### 3.1 Container vs Pod

| Conceito | Descrição Didática | Analogia |
| :--- | :--- | :--- |
| **Container** | Uma unidade de software isolada a nível de sistema operacional (via *cgroups* e *namespaces* do kernel Linux), empacotando código, bibliotecas e dependências. É efêmero e compartilha o kernel com o host. | O contêiner de carga metálico padronizado do transporte marítimo. |
| **Pod** | A menor unidade executável e implantável no Kubernetes. Um Pod encapsula um ou mais contêineres que compartilham obrigatoriamente a mesma interface de rede (`localhost`), o mesmo endereço IP de cluster e os mesmos volumes de armazenamento. | Uma vagem de ervilhas (*pea pod*), onde os grãos (contêineres) vivem juntos no mesmo ecossistema. |

### 3.2 Deployment e ReplicaSet

* **ReplicaSet:** Objeto de baixo nível cujo único objetivo é garantir que um número exato de réplicas de Pods saudáveis esteja em execução a qualquer momento. Se um Pod cai, o ReplicaSet agenda outro imediatamente.
* **Deployment:** Objeto de nível superior que gerencia os ReplicaSets de forma declarativa. Permite realizar versionamento da aplicação, pausas, reversões (*rollbacks*) e atualizações contínuas (*rolling updates*) sem intervenção manual.

### 3.3 Service (ClusterIP vs NodePort)

Um Pod tem ciclo de vida efêmero: ao morrer ou ser recriado, ele recebe um novo endereço IP. O **Service** é uma abstração estável com IP fixo e nome DNS interno que atua como balanceador de carga para um grupo de Pods selecionados por labels:

* **ClusterIP:** Tipo padrão de Service. Expõe o serviço apenas **internamente** dentro da rede do cluster. Ideal para componentes que não devem ser expostos à internet pública (como o nosso `backend` e `postgres`).
* **NodePort:** Abre uma porta estática de alto nível (por padrão, na faixa `30000-32767`) em **todos os Nós físicos ou virtuais** do cluster. Permite que clientes externos acessem o Pod direcionando o tráfego para `<NodeIP>:<NodePort>`. Usado no projeto para o `frontend` na porta `30080`.

### 3.4 ConfigMap vs Secret vs PersistentVolumeClaim (PVC)

| Recurso | Tipo de Dado | Nível de Sigilo | Onde é Aplicado no Projeto |
| :--- | :--- | :--- | :--- |
| **ConfigMap** | Pares chave-valor com texto simples | Não confidencial | `DB_HOST`, `DB_PORT`, `DB_NAME`, `SERVER_PORT`, `CORS_ALLOWED_ORIGINS`, `SHUTDOWN_TIMEOUT`. |
| **Secret** | Pares chave-valor codificados em Base64 | Altamente confidencial (senhas, certificados) | `DB_USER` e `DB_PASSWORD` (credenciais do banco PostgreSQL). |
| **PVC** | Solicitação de armazenamento persistente | N/A (Volume de disco durável) | `/var/lib/postgresql/data` (Garante que as tarefas salvas no PostgreSQL não sumam quando o Pod for recriado). |

### 3.5 Health Probes: Startup, Liveness e Readiness

O Kubernetes monitora os contêineres continuamente por meio de três sondas de saúde:

1. **`startupProbe` (Sonda de Inicialização):**
   * *Objetivo:* Permite que aplicações lentas para inicializar (como aplicações Java/Spring Boot que carregam dezenas de beans e compilam JIT) tenham um tempo de tolerância maior sem serem mortas pelo orquestrador.
   * *Comportamento:* Enquanto a `startupProbe` não passar, todas as outras probes ficam desativadas. Se falhar após o número limite de tentativas (`failureThreshold`), o container é reiniciado.
2. **`livenessProbe` (Sonda de Sobrevivência):**
   * *Objetivo:* Responder à pergunta: *"O processo está travado em deadlock ou corrompido de forma irreversível?"*
   * *Ação em caso de falha:* O Kubernetes **mata o container e reinicia o Pod**.
3. **`readinessProbe` (Sonda de Prontidão):**
   * *Objetivo:* Responder à pergunta: *"A aplicação está pronta para receber tráfego de usuários agora?"*
   * *Ação em caso de falha:* O Kubernetes **NÃO** mata o container. Ele apenas remove temporariamente o Pod dos Endpoints do Service, impedindo que o usuário receba erros 502/503 até que a aplicação se recupere.

### 3.6 Gerenciamento de Recursos: Requests vs Limits

* **`resources.requests`:** Quantidade mínima garantida de CPU e Memória que o Pod necessita. É o valor utilizado pelo `kube-scheduler` para decidir em qual Nó do cluster o Pod cabe e será agendado.
* **`resources.limits`:** Teto máximo de recursos que o container tem permissão de consumir:
  * **CPU (Recurso compressível):** Ao ultrapassar o limite, o kernel aplica *throttling* (redução do tempo de processamento), diminuindo a velocidade sem encerrar o processo.
  * **Memória (Recurso incompressível):** Ao ultrapassar o limite de RAM, o kernel aciona o **OOM Killer** (*Out Of Memory Killer*) e encerra o container imediatamente com código `137` (`OOMKilled`).

---

## 4. Desenvolvimento Local (Sem Docker)

Caso queira executar os projetos diretamente na máquina de desenvolvimento para depuração rápida:

### Pré-requisitos
* Java 21 JDK instalado (`java -version`)
* Node.js 18+ e npm instalados (`node -v`)
* Uma instância local do PostgreSQL rodando na porta 5432 (ou via Docker simples: `docker run --name pg-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=taskmanager -p 5432:5432 -d postgres:15-alpine`)

### 4.1 Executando o Backend

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```
2. Configure as variáveis de ambiente necessárias (ou use o padrão do arquivo `application.properties`):
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=taskmanager
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   ```
3. Execute a aplicação via Maven Wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
4. Verifique se o backend subiu com sucesso acessando no navegador:
   * Saúde da aplicação: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
   * Informações da réplica: [http://localhost:8080/api/info](http://localhost:8080/api/info)
   * Tarefas: [http://localhost:8080/api/tasks](http://localhost:8080/api/tasks)

### 4.2 Executando o Frontend

1. Em outro terminal, navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
4. Acesse a interface web em [http://localhost:5173](http://localhost:5173). O Vite consumirá a API localmente na porta 8080.

---

## 5. Construção das Imagens Docker

Para empacotar a aplicação em imagens prontas para contêineres e orquestração:

```bash
# 1. Construir a imagem do Backend (Spring Boot + JRE Alpine)
docker build -t taskmanager-backend:latest ./backend

# 2. Construir a imagem do Frontend (React + Nginx Alpine)
docker build -t taskmanager-frontend:latest ./frontend
```

Para verificar as imagens geradas localmente:
```bash
docker images | grep taskmanager
```

---

## 6. Execução com Docker Compose

O Docker Compose permite subir todo o ecossistema com um comando, configurando redes internas, variáveis e checagens de saúde automaticamente.

### 6.1 Subir a aplicação

```bash
docker compose up -d
```
> O Docker Compose gerencia a ordem de subida: o PostgreSQL é iniciado primeiro; assim que estiver saudável (`service_healthy`), o backend sobe; e quando o backend responder saudavelmente, o frontend é liberado.

### 6.2 Verificar o status dos contêineres

```bash
docker compose ps
```

### 6.3 Acompanhar logs em tempo real

```bash
# Todos os logs:
docker compose logs -f

# Apenas backend:
docker compose logs -f backend
```

### 6.4 Acessar os serviços via Docker Compose

* **Frontend Web:** [http://localhost:5173](http://localhost:5173)
* **API de Tarefas:** [http://localhost:8080/api/tasks](http://localhost:8080/api/tasks)
* **Endpoint de Saúde (Actuator):** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

### 6.5 Parar e derrubar o ambiente

```bash
# Parar e remover os contêineres e a rede:
docker compose down

# Parar e remover também o volume persistente do banco de dados (reseta os dados):
docker compose down -v
```

---

## 7. Guia de Operação no Kubernetes

Esta seção cobre detalhadamente as tarefas práticas do operador e desenvolvedor em clusters Kubernetes (Minikube, Kind, Docker Desktop ou clusters de nuvem como EKS/GKE).

> [!NOTE]
> Se estiver utilizando um cluster local como o **Kind**, certifique-se de carregar as imagens construídas para o nó do cluster antes de aplicar os manifests:
> ```bash
> kind load docker-image taskmanager-backend:latest --name <nome-do-cluster>
> kind load docker-image taskmanager-frontend:latest --name <nome-do-cluster>
> ```

### 7.1 Criar o Namespace

O isolamento em Kubernetes é feito por meio de `Namespaces`. Para criar o namespace dedicado do projeto:

```bash
# Forma declarativa via manifest:
kubectl apply -f k8s/namespace.yaml

# Ou via comando imperativo direto:
kubectl create namespace taskmanager
```

### 7.2 Aplicar os Manifests

Aplique todos os recursos da aplicação dentro do namespace `taskmanager`:

```bash
kubectl apply -f k8s/ -n taskmanager
```

Acompanhe o status do desdobramento de cada componente:
```bash
kubectl rollout status deployment/postgres -n taskmanager
kubectl rollout status deployment/backend -n taskmanager
kubectl rollout status deployment/frontend -n taskmanager
```

### 7.3 Verificar Pods, Deployments e Services

Para listar e auditar os recursos criados:

```bash
# Listar Pods com detalhes de IP e Nó:
kubectl get pods -n taskmanager -o wide

# Listar Deployments e réplicas disponíveis:
kubectl get deployments -n taskmanager

# Listar Services e portas mapeadas:
kubectl get services -n taskmanager

# Listar o estado do armazenamento persistente (PVC):
kubectl get pvc -n taskmanager

# Listar ConfigMaps e Secrets:
kubectl get configmap,secret -n taskmanager
```

### 7.4 Visualizar Logs

```bash
# Logs do Backend (acompanhamento contínuo):
kubectl logs -n taskmanager -l app=backend -f

# Logs das últimas 50 linhas de um Pod específico:
kubectl logs -n taskmanager <nome-do-pod> --tail=50

# Logs do PostgreSQL:
kubectl logs -n taskmanager -l app=postgres --tail=30
```

### 7.5 Acessar a Aplicação

#### Opção A: Acesso Direto via NodePort (Porta 30080)
O frontend foi exposto como `NodePort` mapeado na porta `30080`:
* Acesse no navegador: [http://localhost:30080](http://localhost:30080)
* *(Se estiver no Minikube, execute: `minikube service frontend -n taskmanager`)*

#### Opção B: Acesso via Port-Forwarding (Túnel Local Seguro)
O encaminhamento de portas é excelente para testes e inspeções sem abrir portas públicas no nó:

* **Túnel para o Frontend:**
  ```bash
  kubectl port-forward -n taskmanager svc/frontend 5173:80
  ```
  Acesse: [http://localhost:5173](http://localhost:5173)

* **Túnel para a API Backend:**
  ```bash
  kubectl port-forward -n taskmanager svc/backend 8080:8080
  ```
  Acesse: [http://localhost:8080/api/tasks](http://localhost:8080/api/tasks) e [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

### 7.6 Escalar o Backend

Uma das maiores forças do Kubernetes é a elasticidade horizontal instantânea:

```bash
# Escalar para 3 réplicas:
kubectl scale deployment backend --replicas=3 -n taskmanager

# Acompanhar o rollout das novas réplicas:
kubectl rollout status deployment/backend -n taskmanager

# Conferir os novos Pods e seus IPs:
kubectl get pods -n taskmanager -l app=backend -o wide
```

Observe como o Service registra automaticamente os novos IPs como endpoints válidos:
```bash
kubectl get endpoints backend -n taskmanager
```

### 7.7 Testar o Balanceamento de Carga

Com 3 réplicas em execução, teste como o Kubernetes Service distribui o tráfego:

#### Pela Interface Web:
Abra [http://localhost:30080](http://localhost:30080), localize o painel **"Testar balanceamento"**, selecione 10 requisições e clique no botão:
* O painel exibirá as requisições atendidas por diferentes réplicas (`backend-xxxxx-yyyyy`), colorindo e contabilizando o percentual de cada Pod.

#### Pelo Terminal (Linux / Bash):
Dispare 10 requisições seguidas para o endpoint `/api/info` através do pod do frontend:
```bash
kubectl exec -n taskmanager deploy/frontend -- sh -c 'for i in $(seq 1 10); do wget -qO- http://backend:8080/api/info; echo ""; done'
```
*Observe a alternância dos campos `"hostname"` e `"ip"` no JSON de resposta.*

### 7.8 Excluir um Pod e Observar Auto-Healing

Para demonstrar a resiliência e a autorrecuperação do Kubernetes diante de falhas físicas ou de software:

1. Liste os Pods do backend para capturar o nome de um deles:
   ```bash
   kubectl get pods -n taskmanager -l app=backend
   ```
2. Em um terminal separado, inicie o monitoramento em tempo real (*watch*):
   ```bash
   kubectl get pods -n taskmanager -l app=backend -w
   ```
3. No primeiro terminal, delete manualmente um dos Pods:
   ```bash
   kubectl delete pod <nome-do-pod-selecionado> -n taskmanager
   ```
4. **Comportamento observado:** O Pod entra em estado `Terminating`, o **ReplicaSet** detecta que a contagem atual está abaixo do estado desejado (3 réplicas) e cria instantaneamente um novo Pod substituto com novo identificador.

### 7.9 Realizar um Rolling Update (Zero Downtime)

Atualizações graduais garantem que uma nova versão do software seja implantada sem queda de serviço:

1. Dispare a reinicialização/atualização do deployment:
   ```bash
   kubectl rollout restart deployment/backend -n taskmanager
   ```
2. Acompanhe a transição passo a passo:
   ```bash
   kubectl rollout status deployment/backend -n taskmanager
   ```
3. **Como funciona internamente:** O Kubernetes cria o novo Pod da nova versão, aguarda ele passar na `startupProbe` e na `readinessProbe` e, somente após estar apto a receber tráfego, inicia a drenagem e encerramento seguro (*graceful shutdown*) do Pod antigo.

---

## 8. Demonstração Sugerida (Roteiro para Apresentação Acadêmica)

Este roteiro ordenado foi planejado para apresentações ao vivo ou gravações em vídeo de 10 a 15 minutos:

### 🎬 Etapa 1: Apresentação da Arquitetura e Subida do Cluster (3 min)
1. **Conceito:** Explicar a separação das camadas (React, Spring Boot, Postgres) e os manifests declarativos.
2. **Execução:**
   ```bash
   # Criar namespace e aplicar manifests
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/ -n taskmanager
   
   # Aguardar os componentes estarem prontos
   kubectl rollout status deployment/postgres -n taskmanager
   kubectl rollout status deployment/backend -n taskmanager
   kubectl rollout status deployment/frontend -n taskmanager
   ```
3. **Inspeção:** Mostrar a visão geral dos recursos:
   ```bash
   kubectl get all -n taskmanager
   ```

### 🎬 Etapa 2: Acesso à Aplicação e Persistência de Dados (3 min)
1. **Acesso:** Abrir o frontend no navegador em [http://localhost:30080](http://localhost:30080).
2. **Ação:** Criar duas tarefas (ex: *"Apresentar seminário de Kubernetes"* e *"Validar escalabilidade"*).
3. **Conceito:** Explicar que a requisição passou pelo Nginx, foi balanceada para o backend via Service e persistida no PostgreSQL através do `PersistentVolumeClaim` (PVC).

### 🎬 Etapa 3: Escalabilidade Horizontal e Balanceamento de Carga (3 min)
1. **Ação no Terminal:**
   ```bash
   kubectl scale deployment backend --replicas=3 -n taskmanager
   kubectl get pods -n taskmanager -l app=backend -w
   ```
2. **Ação no Navegador:**
   * Mostrar o banner superior do frontend que indica o Pod atualmente em atendimento.
   * Clicar no botão **"Testar balanceamento"** com a opção **"Modo Sequencial"** ativada.
   * Mostrar a alternância das respostas entre os Pods em tempo real com cores diferentes.

### 🎬 Etapa 4: Resiliência e Auto-Healing (3 min)
1. **Simulação de Falha:**
   ```bash
   # Em um terminal com split screen:
   kubectl get pods -n taskmanager -l app=backend -w
   
   # No outro terminal, deletar um Pod ativo:
   POD=$(kubectl get pods -n taskmanager -l app=backend -o jsonpath='{.items[0].metadata.name}')
   kubectl delete pod $POD -n taskmanager
   ```
2. **Conceito:** Demonstrar que o ReplicaSet restaurou a contagem desejada em segundos, enquanto a aplicação continuou respondendo sem erro no navegador.

### 🎬 Etapa 5: Rolling Update com Zero Downtime (2 min)
1. **Ação:**
   ```bash
   kubectl rollout restart deployment/backend -n taskmanager
   kubectl rollout status deployment/backend -n taskmanager
   ```
2. **Conceito:** Demonstrar que `maxUnavailable: 0` e `maxSurge: 1` combinados com as `readinessProbes` garantem que nenhum usuário receba conexão recusada durante atualizações de versão.

---

## 9. Auditoria e Boas Práticas do Projeto

Durante a revisão técnica do projeto, os seguintes pontos foram validados e aprimorados:

1. **Eliminação de Credenciais Expostas:**
   * O arquivo `.gitignore` foi ajustado para manter o `.env` estritamente local e versionar o arquivo de modelo seguro `.env.example`.
   * No Kubernetes, usuário e senha do banco de dados são lidos exclusivamente do objeto `Secret` (`taskmanager-secret`), sem senhas *hardcoded* nos manifests de `Deployment`.
2. **URLs e Comunicação Dinâmica:**
   * O frontend utiliza o script `/docker-entrypoint.d/40-envsubst-vite.sh` para injetar a variável de ambiente `VITE_API_URL` em tempo de execução dentro dos arquivos Javascript compilados.
   * No Kubernetes, o Nginx atua como proxy reverso para a rota `/api/`, redirecionando internamente para `http://backend:8080/api/`. Isso evita problemas de CORS no navegador e simplifica o acesso por endereço único.
3. **Resolução de Problema Crítico de JVM com `startupProbe`:**
   * Aplicações Spring Boot em containers com limites de CPU podem levar entre 30 e 50 segundos para completar a compilação JIT e a inicialização de conexões JPA.
   * Sem uma sonda de inicialização, a `livenessProbe` padrão matava o container antes do término da subida, gerando `CrashLoopBackOff`.
   * Foi adicionada uma `startupProbe` com `failureThreshold: 30` e `periodSeconds: 5`, garantindo janela segura de tolerância para o startup do Spring Boot e ativação imediata assim que a aplicação fica pronta.
4. **Armazenamento e Integridade do PostgreSQL:**
   * O Deployment do banco utiliza a estratégia `Recreate` para garantir que apenas uma réplica tente montar o `PersistentVolumeClaim` (RWO) simultaneamente, evitando corrupção de dados.
   * As probes do banco utilizam a ferramenta nativa `pg_isready` autenticada pelas credenciais do Secret.
5. **Multi-Arquitetura e Suporte IPv4/IPv6:**
   * A configuração do Nginx no frontend foi ajustada para escutar tanto em IPv4 (`listen 80;`) quanto em IPv6 (`listen [::]:80;`), garantindo conectividade universal em qualquer distribuição Linux ou ambiente de nuvem.
