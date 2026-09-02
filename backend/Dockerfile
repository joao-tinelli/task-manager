FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Copia os arquivos necessários para o Maven
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Torna o script executável
RUN chmod +x ./mvnw

# Baixa as dependências (offline mode para otimizar os rebuilds)
RUN ./mvnw dependency:go-offline

# Copia o código-fonte
COPY src/ src/

# Compila o projeto e empacota
RUN ./mvnw clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cria um usuário não-root por segurança (opcional, mas boa prática)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copia apenas o .jar gerado da etapa anterior
COPY --from=builder /app/target/*.jar app.jar

# Expõe a porta padrão do Spring Boot
EXPOSE 8080

# Inicia a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
