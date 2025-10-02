/** Minimal model cache using Cache Storage API */
export class ModelCacheManager {
  private static instance: ModelCacheManager | null = null;
  private static CACHE = "onnx-model-cache-v1";

  static getInstance(): ModelCacheManager {
    if (!this.instance) this.instance = new ModelCacheManager();
    return this.instance;
  }

  async getCachedModelData(modelUrl: string): Promise<ArrayBuffer | null> {
    const cache = await caches.open(ModelCacheManager.CACHE);
    const res = await cache.match(modelUrl);
    if (!res) return null;
    return await res.arrayBuffer();
  }

  async storeModelData(modelUrl: string, data: ArrayBuffer): Promise<void> {
    const cache = await caches.open(ModelCacheManager.CACHE);
    await cache.put(modelUrl, new Response(data));
  }

  async deleteCacheEntry(modelUrl: string): Promise<void> {
    const cache = await caches.open(ModelCacheManager.CACHE);
    await cache.delete(modelUrl);
  }
}


