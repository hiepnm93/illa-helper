import { TextProcessor } from '@/src/modules/textProcessor';
import { StyleManager } from '@/src/modules/styleManager';
import {
  UserSettings,
  TriggerMode,
  ReplacementConfig,
  OriginalWordDisplayMode,
  TranslationPosition,
} from '@/src/modules/types';
import { StorageManager } from '@/src/modules/storageManager';
import { TextReplacer } from '@/src/modules/textReplacer';
import { FloatingBallManager } from '@/src/modules/floatingBall';
import { BlacklistManager } from '@/src/modules/options/blacklist/manager';
export default defineContentScript({
  // Áp dụng cho tất cả website
  matches: ['<all_urls>'],

  // Hàm chính
  async main() {
    const storageManager = new StorageManager();
    const settings = await storageManager.getUserSettings();

    // Kiểm tra danh sách chặn
    const blacklistManager = new BlacklistManager();
    if (await blacklistManager.isBlacklisted(window.location.href)) {
      return;
    }

    browser.runtime.sendMessage({
      type: 'validate-configuration',
      source: 'page_load',
    });

    if (!settings.isEnabled) {
      return;
    }

    // --- Phát hiện ngôn ngữ ---
    if (settings.translationDirection === 'auto') {
      settings.translationDirection = await detectPageLanguage();
    }

    // --- Khởi tạo các module ---
    const styleManager = new StyleManager();
    const textProcessor = new TextProcessor(
      settings.enablePronunciationTooltip,
      settings.apiConfig,
    );
    const textReplacer = new TextReplacer(createReplacementConfig(settings));
    const floatingBallManager = new FloatingBallManager(settings.floatingBall);

    // --- Áp dụng cấu hình ban đầu ---
    updateConfiguration(settings, styleManager, textReplacer);

    // --- Khởi tạo floating ball ---
    floatingBallManager.init(async () => {
      // floating ball click translation callback
      // validate API configuration
      const isConfigValid = await browser.runtime.sendMessage({
        type: 'validate-configuration',
        source: 'user_action',
      });

      if (isConfigValid) {
        await processPage(
          textProcessor,
          textReplacer,
          settings.originalWordDisplayMode,
          settings.maxLength,
          settings.translationPosition,
          settings.showParentheses,
        );
      }
    });

    // --- Thực hiện theo chế độ kích hoạt ---
    if (settings.triggerMode === TriggerMode.AUTOMATIC) {
      await processPage(
        textProcessor,
        textReplacer,
        settings.originalWordDisplayMode,
        settings.maxLength,
        settings.translationPosition,
        settings.showParentheses,
      );
    }

    // --- Lắng nghe tin nhắn và thay đổi DOM ---
    setupListeners(
      settings,
      styleManager,
      textProcessor,
      textReplacer,
      floatingBallManager,
    );

    // Lắng nghe message từ background khi click context menu
    browser.runtime.onMessage.addListener(async (message) => {
      if (message.type === 'CONTEXT_MENU_TRANSLATE') {
        const selection = window.getSelection();
        const selectedText = selection?.toString() || '';
        if (!selectedText.trim() || !selection?.rangeCount) {
          return;
        }
        // Lấy range và text nodes liên quan
        const range = selection.getRangeAt(0);
        const textNodes = [];
        const walker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Chỉ lấy node nằm trong vùng chọn
              if (range.intersectsNode(node)) return NodeFilter.FILTER_ACCEPT;
              return NodeFilter.FILTER_REJECT;
            },
          }
        );
        let node;
        while ((node = walker.nextNode())) {
          if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node as Text);
          }
        }
        if (textNodes.length === 0) return;
        // Tạo segment cho vùng chọn
        const segment = {
          id: 'selection',
          textContent: selectedText,
          element: textNodes[0].parentElement || document.body,
          elements: [textNodes[0].parentElement || document.body],
          textNodes: textNodes,
          fingerprint: 'selection',
          domPath: '',
        };
        // Xử lý dịch và thay thế vào DOM
        await textProcessor['processingCoordinator'].processSelectionSegment(
          segment,
          textReplacer,
          settings.originalWordDisplayMode,
          settings.translationPosition,
          settings.showParentheses,
        );
        // Bỏ chọn sau khi thay thế
        selection.removeAllRanges();
      }
    });
  },
});

function createReplacementConfig(settings: UserSettings): ReplacementConfig {
  return {
    userLevel: settings.userLevel,
    replacementRate: settings.replacementRate,
    useGptApi: settings.useGptApi,
    apiConfig: settings.apiConfig,
    inlineTranslation: true,
    translationStyle: settings.translationStyle,
    translationDirection: settings.translationDirection,
  };
}

/**
 * 根据最新设置更新所有相关模块的配置
 */
function updateConfiguration(
  settings: UserSettings,
  styleManager: StyleManager,
  textReplacer: TextReplacer,
) {
  styleManager.setTranslationStyle(settings.translationStyle);
  textReplacer.setConfig(createReplacementConfig(settings));
}

/**
 * Xử lý toàn bộ trang hoặc phần nội dung động
 */
async function processPage(
  textProcessor: TextProcessor,
  textReplacer: TextReplacer,
  originalWordDisplayMode: OriginalWordDisplayMode,
  maxLength: number | undefined,
  translationPosition: TranslationPosition,
  showParentheses: boolean,
) {
  await textProcessor.processRoot(
    document.body,
    textReplacer,
    originalWordDisplayMode,
    maxLength,
    translationPosition,
    showParentheses,
  );
}

/**
 * Thiết lập DOM Observer để xử lý nội dung động
 * Sử dụng state manager mới để phát hiện lặp lại thông minh hơn
 */
function setupListeners(
  settings: UserSettings,
  styleManager: StyleManager,
  textProcessor: TextProcessor,
  textReplacer: TextReplacer,
  floatingBallManager: FloatingBallManager,
) {
  // Lắng nghe tin nhắn từ popup
  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'settings_updated') {
      // Đã được cập nhật
      const newSettings: UserSettings = message.settings;

      // Kiểm tra xem có cần tải lại trang không
      const needsPageReload =
        settings.triggerMode !== newSettings.triggerMode ||
        settings.isEnabled !== newSettings.isEnabled ||
        settings.enablePronunciationTooltip !==
          newSettings.enablePronunciationTooltip ||
        settings.translationDirection !== newSettings.translationDirection ||
        settings.userLevel !== newSettings.userLevel ||
        settings.useGptApi !== newSettings.useGptApi;

      if (needsPageReload) {
        window.location.reload();
        return;
      }

      // Cập nhật đối tượng cài đặt cục bộ
      Object.assign(settings, newSettings);

      // Áp dụng cấu hình mới
      updateConfiguration(settings, styleManager, textReplacer);

      // Cập nhật cấu hình API
      textProcessor.updateApiConfig(settings.apiConfig);

      // Cập nhật cấu hình floating ball
      floatingBallManager.updateConfig(settings.floatingBall);
    } else if (message.type === 'MANUAL_TRANSLATE') {
      // Nhận được yêu cầu dịch thủ công
      if (settings.triggerMode === TriggerMode.MANUAL) {
        const isConfigValid = await browser.runtime.sendMessage({
          type: 'validate-configuration',
          source: 'user_action',
        });
        if (isConfigValid) {
          await processPage(
            textProcessor,
            textReplacer,
            settings.originalWordDisplayMode,
            settings.maxLength,
            settings.translationPosition,
            settings.showParentheses,
          );
        }
      }
    }
  });

  // Chỉ quan sát DOM thay đổi trong chế độ tự động
  if (settings.triggerMode === TriggerMode.AUTOMATIC) {
    setupDomObserver(
      textProcessor,
      textReplacer,
      settings.originalWordDisplayMode,
      settings.maxLength,
      settings.translationPosition,
      settings.showParentheses,
    );
  }
}

/**
 * Thiết lập DOM Observer để xử lý nội dung động
 * Sử dụng state manager mới để phát hiện lặp lại thông minh hơn
 */
function setupDomObserver(
  textProcessor: TextProcessor,
  textReplacer: TextReplacer,
  originalWordDisplayMode: OriginalWordDisplayMode,
  maxLength: number | undefined,
  translationPosition: TranslationPosition,
  showParentheses: boolean,
) {
  let debounceTimer: number;
  const nodesToProcess = new Set<Node>();
  const observerConfig = {
    childList: true,
    subtree: true,
    characterData: true,
  };

  const observer = new MutationObserver((mutations) => {
    let hasValidChanges = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          // Bỏ qua các phần tử kết quả đã biết
          if (isProcessingResultNode(node)) {
            return;
          }

          // Xử lý tất cả các phần tử nút mới thêm
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const textContent = element.textContent?.trim();

            // Chỉ xử lý nếu có đủ nội dung văn bản
            if (textContent && textContent.length > 15) {
              nodesToProcess.add(node);
              hasValidChanges = true;
            }
          }
        });
      } else if (
        mutation.type === 'characterData' &&
        mutation.target.parentElement
      ) {
        const parentElement = mutation.target.parentElement;
        if (!isProcessingResultNode(parentElement)) {
          nodesToProcess.add(parentElement);
          hasValidChanges = true;
        }
      }
    });

    // Chỉ xử lý khi có thay đổi hữu ích
    if (!hasValidChanges) {
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(async () => {
      if (nodesToProcess.size === 0) return;

      const topLevelNodes = new Set<Node>();
      nodesToProcess.forEach((node) => {
        if (
          document.body.contains(node) &&
          !isDescendant(node, nodesToProcess)
        ) {
          topLevelNodes.add(node);
        }
      });

      // Tạm dừng quan sát để tránh kích hoạt lặp lại trong quá trình xử lý
      observer.disconnect();

      try {
        for (const node of topLevelNodes) {
          await textProcessor.processRoot(
            node,
            textReplacer,
            originalWordDisplayMode,
            maxLength,
            translationPosition,
            showParentheses,
          );
        }
      } catch (_) {
        // Ẩn thông báo lỗi
      }

      nodesToProcess.clear();
      observer.observe(document.body, observerConfig);
    }, 150);
  });

  observer.observe(document.body, observerConfig);
}

/**
 * Kiểm tra xem nút có phải là nút kết quả xử lý (các phần tử có chức năng như dịch, phát âm, ...)
 */
function isProcessingResultNode(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;

    // Kiểm tra xem có phải là phần tử liên quan đến dịch hoặc phát âm
    const processingClasses = [
      'wxt-translation-term',
      'wxt-original-word',
      'wxt-pronunciation-tooltip',
      'wxt-phonetic-text',
      'wxt-tts-button',
      'wxt-processing',
    ];

    for (const className of processingClasses) {
      if (element.classList.contains(className)) {
        return true;
      }
    }

    // Kiểm tra xem có chứa thuộc tính đánh dấu xử lý
    if (
      element.hasAttribute('data-wxt-word-processed') ||
      element.hasAttribute('data-pronunciation-added')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Kiểm tra xem một nút có phải là nút con của bất kỳ nút nào trong tập hợp nút
 */
function isDescendant(node: Node, nodeSet: Set<Node>): boolean {
  let parent = node.parentElement;
  while (parent) {
    if (nodeSet.has(parent)) return true;
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Sử dụng browser.i18n.detectLanguage API để tự động phát hiện ngôn ngữ chính của trang
 */
async function detectPageLanguage(): Promise<string> {
  try {
    const textSample = document.body.innerText.substring(0, 1000);
    if (!textSample.trim()) return 'zh-to-en';

    const result = await browser.i18n.detectLanguage(textSample);

    if (result?.languages?.[0]?.language === 'en') {
      return 'en-to-zh';
    }
    return 'zh-to-en';
  } catch (_) {
    return 'zh-to-en'; // Nếu lỗi thì mặc định
  }
}
