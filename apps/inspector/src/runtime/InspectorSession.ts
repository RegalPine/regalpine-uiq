/**
 * P9：Inspector 会话管理（AD-20）。
 *
 * 每个 Inspector 会话拥有唯一 sessionId 和递增 requestSequence。
 * 旧异步结果到达时比对 sequence 丢弃，防止覆盖新目标/主题。
 * 取消会话释放资源，已生成快照保持不可变。
 */

let sessionCounter = 0;

/** 生成会话 ID（单调递增，确保唯一性；不依赖 crypto 以避免环境限制）。 */
function generateSessionId(): string {
  sessionCounter += 1;
  return `inspector-session-${sessionCounter}-${Date.now().toString(36)}`;
}

export interface InspectorSessionHandle {
  readonly sessionId: string;
  /** 当前请求序号；每次新分析递增。 */
  readonly requestSequence: number;
  /** 取消令牌；用于中止进行中的异步操作。 */
  readonly signal: AbortSignal;
  /** 会话是否已被取消或替换。 */
  readonly isCancelled: boolean;
}

export interface InspectorSessionManager {
  /** 当前活跃会话（只读）。 */
  readonly current: InspectorSessionHandle | null;
  /** 开始新会话：递增 sequence，取消旧会话，返回新 handle。 */
  startSession(): InspectorSessionHandle;
  /** 取消当前会话。 */
  cancelCurrent(): void;
  /** 检查给定 sequence 是否仍然有效（未被后续会话取代）。 */
  isCurrent(sequence: number): boolean;
}

/** 创建 Inspector 会话管理器。 */
export function createInspectorSessionManager(): InspectorSessionManager {
  let currentHandle:
    | (InspectorSessionHandle & { readonly _abortController: AbortController })
    | null = null;

  return {
    get current(): InspectorSessionHandle | null {
      return currentHandle;
    },

    startSession(): InspectorSessionHandle {
      // 取消旧会话
      if (currentHandle !== null && !currentHandle.isCancelled) {
        currentHandle._abortController.abort();
        (currentHandle as { isCancelled: boolean }).isCancelled = true;
      }

      const controller = new AbortController();
      const sequence = (currentHandle?.requestSequence ?? 0) + 1;
      const handle = {
        sessionId: generateSessionId(),
        requestSequence: sequence,
        signal: controller.signal,
        isCancelled: false,
        _abortController: controller,
      };
      currentHandle = handle;
      return handle;
    },

    cancelCurrent(): void {
      if (currentHandle !== null && !currentHandle.isCancelled) {
        currentHandle._abortController.abort();
        (currentHandle as { isCancelled: boolean }).isCancelled = true;
      }
    },

    isCurrent(sequence: number): boolean {
      return (
        currentHandle !== null &&
        !currentHandle.isCancelled &&
        currentHandle.requestSequence === sequence
      );
    },
  };
}
