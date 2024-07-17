FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG TARGETARCH
ARG BUILD_CONFIGURATION=Release

WORKDIR /app

COPY [ "src/Blank.Presentation/Blank.Presentation.csproj", "src/Blank.Presentation/" ]
RUN dotnet restore "src/Blank.Presentation/Blank.Presentation.csproj" -a $TARGETARCH --use-lock-file --locked-mode

COPY . .

RUN dotnet build "src/Blank.Presentation/Blank.Presentation.csproj" -c $BUILD_CONFIGURATION -a $TARGETARCH --no-restore -o build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "src/Blank.Presentation/Blank.Presentation.csproj" -c $BUILD_CONFIGURATION -a $TARGETARCH --no-restore -o publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Blank.Presentation.dll"]
