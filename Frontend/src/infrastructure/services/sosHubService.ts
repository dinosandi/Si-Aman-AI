import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel, HubConnectionState } from "@microsoft/signalr";

export interface UpdateSosLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export class SosHubService {
  private connection: HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private onSosCallbacks: Array<(event: { method: string; data: any }) => void> = [];
  private shouldBeConnected = false;

  onSosReceived(callback: (event: { method: string; data: any }) => void): () => void {
    this.onSosCallbacks.push(callback);
    return () => {
      this.onSosCallbacks = this.onSosCallbacks.filter((cb) => cb !== callback);
    };
  }

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
      const hubUrl = `${baseUrl}/hubs/sos`;

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => localStorage.getItem("si_aman_token") || "",
          transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Register all possible incoming SOS broadcast event listeners
      const clientMethods = [
        "ReceiveSosLocation",
        "ReceiveSosUpdate",
        "SosLocationUpdated",
        "SosReceived",
        "SosUpdated",
        "LocationUpdated",
        "ReceiveLocation",
        "SosAlert",
        "SosConfirmed",
        "SosTriggered",
        "SosResolved",
      ];

      clientMethods.forEach((method) => {
        this.connection?.on(method, (data) => {
          this.onSosCallbacks.forEach((cb) => cb({ method, data }));
        });
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
            // ignore
          }
        }
        if (!this.shouldBeConnected) {
          await this.connection.stop();
        }
      }
    }
  }

  async triggerSos(latitude: number, longitude: number): Promise<string> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return await this.connection.invoke<string>("TriggerSos", latitude, longitude);
    } else {
      throw new Error("SignalR SOS Hub is not connected.");
    }
  }

  async resolveSos(alertId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke("ResolveSos", alertId);
    } else {
      throw new Error("SignalR SOS Hub is not connected.");
    }
  }

  async updateSosLocation(request: UpdateSosLocationRequest): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }
    
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      const candidateMethods = [
        "UpdateSosLocation",
        "SendLocationSos",
        "SendSosLocation",
        "SendSosUpdate",
        "SendLocation",
        "UpdateLocation",
        "UpdateSos"
      ];
      
      let success = false;
      for (const method of candidateMethods) {
        try {
          // Pass two separate double parameters: latitude, longitude
          await this.connection.invoke(method, request.latitude, request.longitude);
          success = true;
          break;
        } catch (err: any) {
          // If the server explicitly says the method doesn't exist, we try the next candidate
          if (err?.message && (err.message.includes("Method does not exist") || err.message.includes("does not exist"))) {
            continue;
          }
          // If the method exists but failed due to another issue (e.g. database or parameter validation), we consider it found but log a warning
          console.warn(`SOS Hub: Method '${method}' exists but returned error:`, err.message);
          success = true;
          break;
        }
      }
      
      if (!success) {
        console.debug("SOS Hub: None of the candidate methods exist or succeeded on the backend.");
      }
    } else {
      throw new Error("SignalR SOS Hub connection is not connected.");
    }
  }
}

export const sosHubService = new SosHubService();
