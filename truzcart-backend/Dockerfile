# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY pom.xml .
# Download all required dependencies into one layer
RUN mvn dependency:go-offline -B
# Copy source code and build
COPY src ./src
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
