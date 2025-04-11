# Build backend only
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy only the backend project and solution
COPY ScoutBase.sln ./
COPY scoutbase.server/ ./scoutbase.server/
WORKDIR /app/scoutbase.server
RUN dotnet restore
RUN dotnet publish -c Release -o /app/out

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "scoutbase.server.dll"]
