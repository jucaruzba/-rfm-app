# Usar imagen de Maven con Java 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Limpiar cualquier cosa previa
RUN rm -rf /build/*

# Copiar solo lo necesario para compilar
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Compilar dentro del contenedor (NO usar JAR local)
RUN mvn clean package -DskipTests

# Verificar el JAR generado
RUN ls -la target/

# Segunda etapa: ejecución
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Crear directorios de storage
RUN mkdir -p /app/storage/profiles /app/storage/activities

# Copiar el JAR compilado en el contenedor
COPY --from=build /build/target/application-0.0.1-SNAPSHOT.jar app.jar

# Verificar que el archivo se copió
RUN ls -la /app/

# Forzar el perfil docker y las rutas
ENTRYPOINT ["sh", "-c", "java -jar app.jar --spring.profiles.active=docker --project.storage.root-path=/app/storage"]

EXPOSE 8080