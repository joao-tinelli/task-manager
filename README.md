# Task Manager - Orquestração com Docker Compose

Este projeto utiliza Docker Compose para gerenciar e iniciar todos os seus componentes de forma integrada. 
O ambiente é composto por três contêineres:
1. **Frontend**: Aplicação React rodando no Nginx (Porta 5173)
2. **Backend**: Aplicação Spring Boot (Porta 8080)
3. **Database**: PostgreSQL (Porta 5432)

## Requisitos
- Docker
- Docker Compose

## Como Executar

### 1. Iniciar a aplicação
Para subir todos os serviços (frontend, backend e banco de dados) e deixá-los rodando em _background_:
```bash
docker compose up -d
```
> O Docker Compose respeitará a ordem de _Health Check_, ou seja, o backend só inicia após o PostgreSQL estar de pé, e o frontend só inicia após o backend estar online.

### 2. Acessar a aplicação
- **Frontend (Interface do Usuário):** [http://localhost:5173](http://localhost:5173)
- **Backend (API Base URL):** [http://localhost:8080/api](http://localhost:8080/api)
- **Backend (Health Check):** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

### 3. Verificar o status dos contêineres
Para visualizar os contêineres, suas portas expostas e conferir se o status deles é `healthy`:
```bash
docker compose ps
```

### 4. Visualizar os logs
Para visualizar os logs contínuos de todos os serviços (útil para encontrar erros ou ver as requisições em tempo real):
```bash
docker compose logs -f
```
Se preferir ver apenas um dos serviços:
```bash
docker compose logs -f backend
```

### 5. Parar a aplicação
Para desligar o ambiente e remover a rede criada, sem afetar o volume persistente do banco de dados:
```bash
docker compose down
```

Caso precise redefinir completamente o ambiente (Deletar as tabelas e recriar o banco do zero), execute a remoção de volumes em anexo:
```bash
docker compose down -v
```

## Configuração
O sistema utiliza um arquivo `.env` localizado na raiz do projeto (Ignorado pelo controle de versão por questões de segurança). 
Se necessário montar um ambiente do zero, basta criar uma cópia de `.env.example` nomeada para `.env` com as configurações locais de banco.
