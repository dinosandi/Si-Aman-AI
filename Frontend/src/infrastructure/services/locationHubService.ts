import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel, HubConnectionState } from "@microsoft/signalr";

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export class LocationHubService {
  private connection: HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private onUpdatedCallback: ((data: { latitude: number; longitude: number; updatedAt: string }) => void) | null = null;
  private shouldBeConnected = false;

  async startConnection(): Promise<void> {
    this.shouldBeConnected = true;
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return;
    }
    if (this.startPromise) {
      return this.startPromise;
    }

    if (!this.connection) {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5105/api";
      const baseUrl = apiUrl.replace(/\/api$/, "");
      const hubUrl = `${baseUrl}/hubs/location`;

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => localStorage.getItem("si_aman_token") || "",
          transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          // Since we use withCredentials: true on Axios, SignalR connection also sends cookies automatically
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      this.connection.on("LocationUpdated", (data) => {
        if (this.onUpdatedCallback) {
          this.onUpdatedCallback(data);
        }
      });
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      this.startPromise = this.connection.start().finally(() => {
        this.startPromise = null;
      });
      await this.startPromise;
    }
  }

  async stopConnection(): Promise<void> {
    this.shouldBeConnected = false;
    if (this.connection) {
      if (
        this.connection.state !== HubConnectionState.Disconnected &&
        this.connection.state !== HubConnectionState.Disconnecting
      ) {
        if (this.startPromise) {
          try {
            await this.startPromise;
          } catch (e) {
            // ignore startup errors
          }
        }
        if (!this.shouldBeConnected) {
          await this.connection.stop();
        }
      }
    }
  }

  async updateLocation(request: UpdateLocationRequest): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }
    
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke("UpdateLocation", request);
    } else {
      throw new Error("SignalR connection is not in Connected state.");
    }
  }

  onLocationUpdated(callback: (data: { latitude: number; longitude: number; updatedAt: string }) => void) {
    this.onUpdatedCallback = callback;
  }
}

export const locationHubService = new LocationHubService();
