import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from "@microsoft/signalr";

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export class LocationHubService {
  private connection: HubConnection | null = null;
  private onUpdatedCallback: ((data: { latitude: number; longitude: number; updatedAt: string }) => void) | null = null;

  startConnection(): Promise<void> {
    if (this.connection) {
      return Promise.resolve();
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5105/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    const hubUrl = `${baseUrl}/hubs/location`;

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
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

    return this.connection.start();
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  async updateLocation(request: UpdateLocationRequest): Promise<void> {
    if (!this.connection) {
      throw new Error("SignalR connection has not been started.");
    }
    
    // Call the UpdateLocation method on the LocationHub
    await this.connection.invoke("UpdateLocation", request);
  }

  onLocationUpdated(callback: (data: { latitude: number; longitude: number; updatedAt: string }) => void) {
    this.onUpdatedCallback = callback;
  }
}

export const locationHubService = new LocationHubService();
