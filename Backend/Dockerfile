FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY out/ .

ENV ASPNETCORE_URLS=http://+:5105
ENV ASPNETCORE_ENVIRONMENT=Development
EXPOSE 5105

ENTRYPOINT ["dotnet", "SiAman.API.dll"]
