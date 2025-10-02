/**
 * Consolidated message type constants for Chrome extension communication
 */

export enum MessageTarget {
  Offscreen = "offscreen",
  ContentScript = "content_script",
  Background = "background",
}

export const BACKGROUND_MESSAGE_TYPES = {
  SWITCH_SEMANTIC_MODEL: "switch_semantic_model",
  GET_MODEL_STATUS: "get_model_status",
  UPDATE_MODEL_STATUS: "update_model_status",
  GET_STORAGE_STATS: "get_storage_stats",
  CLEAR_ALL_DATA: "clear_all_data",
  INITIALIZE_SEMANTIC_ENGINE: "initialize_semantic_engine",
} as const;

export const OFFSCREEN_MESSAGE_TYPES = {
  SIMILARITY_ENGINE_INIT: "similarityEngineInit",
  SIMILARITY_ENGINE_COMPUTE: "similarityEngineCompute",
  SIMILARITY_ENGINE_BATCH_COMPUTE: "similarityEngineBatchCompute",
  SIMILARITY_ENGINE_STATUS: "similarityEngineStatus",
} as const;

export type BackgroundMessageType =
  (typeof BACKGROUND_MESSAGE_TYPES)[keyof typeof BACKGROUND_MESSAGE_TYPES];
export type OffscreenMessageType =
  (typeof OFFSCREEN_MESSAGE_TYPES)[keyof typeof OFFSCREEN_MESSAGE_TYPES];


