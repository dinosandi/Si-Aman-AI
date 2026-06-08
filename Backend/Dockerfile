
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY . .

RUN dotnet restore SiAman.API/SiAman.API.csproj
RUN dotnet publish SiAman.API/SiAman.API.csproj \
    -c Release \
    -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5105
ENV ASPNETCORE_ENVIRONMENT=Development

EXPOSE 5105

ENTRYPOINT ["dotnet", "SiAman.API.dll"]
