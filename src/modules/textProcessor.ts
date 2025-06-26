import {
  OriginalWordDisplayMode,
  ApiConfig,
  TranslationPosition,
} from './types';
import { PronunciationService } from './pronunciation/services/PronunciationService';
import { DEFAULT_PRONUNCIATION_CONFIG } from './pronunciation/config';
import { ContentSegmenter } from './processing/ContentSegmenter';
import { ProcessingCoordinator } from './processing/ProcessingCoordinator';
import { globalProcessingState } from './processing/ProcessingStateManager';

/**
 * 文本处理模块
 * 负责遍历DOM，提取文本节点，并进行处理
 */

// 文本节点处理器
export class TextProcessor {
  private pronunciationService: PronunciationService;
  private contentSegmenter: ContentSegmenter;
  private processingCoordinator: ProcessingCoordinator;

  constructor(
    enablePronunciationTooltip: boolean = true,
    apiConfig?: ApiConfig,
  ) {
    // 创建发音服务配置
    const pronunciationConfig = {
      ...DEFAULT_PRONUNCIATION_CONFIG,
      uiConfig: {
        ...DEFAULT_PRONUNCIATION_CONFIG.uiConfig,
        tooltipEnabled: enablePronunciationTooltip,
      },
    };

    this.pronunciationService = new PronunciationService(
      pronunciationConfig,
      apiConfig,
    );
    this.contentSegmenter = new ContentSegmenter();
    this.processingCoordinator = new ProcessingCoordinator(
      this.pronunciationService,
    );
    this.injectGlowStyle();
  }

  private injectGlowStyle(): void {
    if ((window as any).wxtGlowStyleInjected) return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes wxt-glow-animation {
        from {
          background-color: rgba(106, 136, 224, 0.3);
          box-shadow: 0 0 8px rgba(106, 136, 224, 0.5);
        }
        to {
          background-color: transparent;
          box-shadow: 0 0 0 transparent;
        }
      }
      .wxt-glow {
        animation: wxt-glow-animation 0.8s ease-out;
        border-radius: 3px;
      }
      .wxt-original-word--learning {
        filter: blur(5px);
        cursor: pointer;
        transition: filter 0.2s ease-in-out;
      }

      .wxt-original-word--learning:hover {
        filter: blur(0) !important;
      }

      /* 增强a标签内学习模式的悬停支持 */
      a .wxt-original-word--learning:hover,
      a:hover .wxt-original-word--learning {
        filter: blur(0) !important;
      }

      /* 音标错误提示样式 */
      .wxt-phonetic-error {
        font-family: 'SF Mono', 'Monaco', 'Consolas', 'Roboto Mono', monospace;
        font-size: 13px;
        color: #ff9999;
        font-style: italic;
        font-weight: 500;
        background: linear-gradient(135deg, rgba(255, 153, 153, 0.1) 0%, rgba(255, 153, 153, 0.05) 100%);
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-block;
        border: 1px solid rgba(255, 153, 153, 0.3);
        letter-spacing: 0.02em;
        opacity: 0.8;
      }

      /* 嵌套单词悬浮框标题行布局 */
      .wxt-word-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .wxt-word-title-row .wxt-word-main {
        flex: 1;
      }

      .wxt-word-title-row .wxt-accent-buttons {
        flex-shrink: 0;
      }
      @keyframes wxt-processing-animation {
        0% {
          background-color: rgba(106, 136, 224, 0.1);
        }
        50% {
          background-color: rgba(106, 136, 224, 0.3);
        }
        100% {
          background-color: rgba(106, 136, 224, 0.1);
        }
      }
      .wxt-processing {
        animation: wxt-processing-animation 2s infinite ease-in-out;
        border-radius: 3px;
        transition: background-color 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    (window as any).wxtGlowStyleInjected = true;
  }

  // =================================================================
  // Section 1: 新的核心处理流程 (New Core Processing Flow)
  // =================================================================
  public async processRoot(
    root: Node,
    textReplacer: any,
    originalWordDisplayMode: OriginalWordDisplayMode,
    maxLength: number = 400,
    translationPosition: TranslationPosition,
    showParentheses: boolean,
  ): Promise<void> {
    try {
      this.contentSegmenter.updateConfig({
        maxSegmentLength: maxLength,
        minSegmentLength: 20,
        enableSmartBoundary: true,
        mergeSmallSegments: true,
      });
      const segments = this.contentSegmenter.segmentContent(root);
      if (segments.length === 0) {
        return;
      }
      // Lọc các segment nằm trong vùng ±1 màn hình quanh vị trí cuộn
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const minY = scrollY - viewportHeight;
      const maxY = scrollY + 2 * viewportHeight;
      const visibleSegments = segments.filter((seg) => {
        const rect = seg.element.getBoundingClientRect();
        const absTop = rect.top + window.scrollY;
        const absBottom = rect.bottom + window.scrollY;
        return absBottom >= minY && absTop <= maxY;
      });
      // Dịch từng đoạn/batch nhỏ, hiển thị dần
      const batchSize = 3;
      for (let i = 0; i < visibleSegments.length; i += batchSize) {
        const batch = visibleSegments.slice(i, i + batchSize);
        await this.processingCoordinator.processSegments(
          batch,
          textReplacer,
          originalWordDisplayMode,
          translationPosition,
          showParentheses,
        );
      }
    } catch (_) {
      // 静默处理错误
    }
  }

  // =================================================================
  // Section 2: 配置管理和统计 (Configuration & Statistics)
  // =================================================================

  /**
   * 更新API配置
   * 支持运行时API配置更新，配置变更会立即生效
   */
  updateApiConfig(apiConfig: ApiConfig): void {
    try {
      if (this.pronunciationService) {
        this.pronunciationService.updateApiConfig(apiConfig);
      }
    } catch (_) {
      // 静默处理错误
    }
  }

  /**
   * 获取处理统计信息
   */
  getProcessingStats() {
    return {
      coordinator: this.processingCoordinator.getStats(),
      global: globalProcessingState.getProcessingStats(),
    };
  }

  /**
   * 重置处理统计信息
   */
  resetStats(): void {
    this.processingCoordinator.resetStats();
    globalProcessingState.reset();
  }
}
