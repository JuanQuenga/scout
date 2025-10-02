/** Simplified copy from GROK SIMD math engine for bundling */
/* global chrome */
export class SIMDMathEngine {
  private wasmModule: any = null;
  private simdMath: any = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing && this.initPromise) return this.initPromise;
    this.isInitializing = true;
    this.initPromise = this._doInitialize().finally(
      () => (this.isInitializing = false)
    );
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    const wasmUrl = chrome.runtime.getURL("workers/simd_math.js");
    const mod = await import(wasmUrl);
    const inst = await mod.default();
    this.wasmModule = {
      SIMDMath: mod.SIMDMath,
      memory: inst.memory,
      default: mod.default,
    };
    this.simdMath = new this.wasmModule.SIMDMath();
    this.isInitialized = true;
  }

  static async checkSIMDSupport(): Promise<boolean> {
    try {
      if (
        typeof WebAssembly !== "object" ||
        typeof WebAssembly.validate !== "function"
      )
        return false;
      const basic = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      ]);
      return WebAssembly.validate(basic);
    } catch {
      return false;
    }
  }

  async similarityMatrix(
    _a: Float32Array[],
    _b: Float32Array[]
  ): Promise<number[][]> {
    return [];
  }

  dispose(): void {
    try {
      this.simdMath?.free?.();
    } catch {}
    this.simdMath = null;
    this.wasmModule = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
  }
}


