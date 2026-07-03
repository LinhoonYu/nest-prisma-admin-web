import { ref, computed, readonly } from "vue";
import { io, Socket } from "socket.io-client";
import { AuthStorage } from "@/utils/auth";

export interface UseSseOptions {
  url?: string;
  debug?: boolean;
  connectionTimeout?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  maxReconnectAttempts?: number;
}

type EventHandler = (data: unknown) => void;

export enum SseConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
}

let globalInstance: ReturnType<typeof createSseConnection> | null = null;

function createSseConnection(options: UseSseOptions = {}) {
  // 走同源路径，通过 Vite 代理（/socket.io）或线上 Nginx 反代转发到后端
  const defaultUrl = "";

  const config = {
    url: options.url ?? defaultUrl,
    debug: options.debug ?? false,
    connectionTimeout: options.connectionTimeout ?? 10000,
    reconnectInterval: options.reconnectInterval ?? 5000,
    maxReconnectInterval: options.maxReconnectInterval ?? 120000,
    maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
  };

  const connectionState = ref<SseConnectionState>(SseConnectionState.DISCONNECTED);
  const isConnected = computed(() => connectionState.value === SseConnectionState.CONNECTED);

  let socket: Socket | null = null;
  let isManualDisconnect = false;
  let reconnectAttempts = 0;
  let currentReconnectInterval = config.reconnectInterval;

  const eventHandlers = new Map<string, Set<EventHandler>>();

  const log = (...args: unknown[]) => {
    if (config.debug) {
      console.debug("[Socket]", ...args);
    }
  };
  const logError = (...args: unknown[]) => console.error("[Socket]", ...args);

  const resetReconnectState = () => {
    reconnectAttempts = 0;
    currentReconnectInterval = config.reconnectInterval;
  };

  const advanceReconnectState = () => {
    currentReconnectInterval = Math.min(currentReconnectInterval * 2, config.maxReconnectInterval);
  };

  const connect = () => {
    if (socket?.connected) {
      log("Socket 已连接，跳过重复连接");
      return;
    }
    if (connectionState.value === SseConnectionState.CONNECTING) {
      log("Socket 正在连接中，跳过重复连接");
      return;
    }

    connectionState.value = SseConnectionState.CONNECTING;
    isManualDisconnect = false;

    const token = AuthStorage.getAccessToken();
    if (!token) {
      log("未检测到有效令牌，跳过 Socket 连接");
      connectionState.value = SseConnectionState.DISCONNECTED;
      return;
    }

    log("正在建立 Socket 连接...");

    // 如果存在旧的非活跃 socket，先断开，避免孤儿连接
    if (socket && !socket.connected) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    socket = io(config.url, {
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
      timeout: config.connectionTimeout,
      reconnection: false,
    });

    socket.on("connect", () => {
      connectionState.value = SseConnectionState.CONNECTED;
      resetReconnectState();
      log("Socket 连接已建立");
    });

    socket.on("disconnect", (reason) => {
      connectionState.value = SseConnectionState.DISCONNECTED;
      log("Socket 连接已断开:", reason);

      if (!isManualDisconnect) {
        scheduleReconnect();
      }
    });

    socket.on("connect_error", (err) => {
      logError("Socket 连接错误:", err.message);
      connectionState.value = SseConnectionState.DISCONNECTED;

      if (!isManualDisconnect) {
        scheduleReconnect();
      }
    });

    for (const [event, handlers] of eventHandlers) {
      for (const handler of handlers) {
        socket.on(event, handler);
      }
    }
  };

  const scheduleReconnect = () => {
    if (isManualDisconnect) return;
    if (config.maxReconnectAttempts > 0 && reconnectAttempts >= config.maxReconnectAttempts) {
      log(`已达到最大重试次数 ${config.maxReconnectAttempts}，停止重连`);
      return;
    }

    reconnectAttempts++;
    log(`将在 ${currentReconnectInterval}ms 后重试（${reconnectAttempts}）`);

    setTimeout(() => {
      connect();
      advanceReconnectState();
    }, currentReconnectInterval);
  };

  const on = <T = unknown>(eventName: string, handler: (data: T) => void): (() => void) => {
    if (!eventHandlers.has(eventName)) {
      eventHandlers.set(eventName, new Set());
    }
    const wrappedHandler: EventHandler = (data) => handler(data as T);
    eventHandlers.get(eventName)!.add(wrappedHandler);

    socket?.on(eventName, wrappedHandler);

    log(`已订阅事件: ${eventName}`);

    return () => {
      const handlers = eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(wrappedHandler);
        socket?.off(eventName, wrappedHandler);
        if (handlers.size === 0) {
          eventHandlers.delete(eventName);
        }
      }
    };
  };

  const disconnect = () => {
    isManualDisconnect = true;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    connectionState.value = SseConnectionState.DISCONNECTED;
    log("Socket 连接已断开");
  };

  const cleanup = () => {
    disconnect();
    eventHandlers.clear();
    log("Socket 资源已清理");
  };

  return {
    connectionState: readonly(connectionState),
    isConnected,
    connect,
    disconnect,
    cleanup,
    on,
  };
}

export function useSse(options: UseSseOptions = {}) {
  if (!globalInstance) {
    globalInstance = createSseConnection(options);
  }
  return globalInstance;
}

export function cleanupSse() {
  if (globalInstance) {
    globalInstance.cleanup();
    globalInstance = null;
  }
}
