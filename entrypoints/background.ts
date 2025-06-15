import { browser } from 'wxt/browser';
import { DEFAULT_SETTINGS } from '@/src/modules/types';

export default defineBackground(() => {
  // Khi extension được cài đặt lần đầu, thiết lập giá trị mặc định
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      browser.storage.sync.set(DEFAULT_SETTINGS);
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'show-notification') {
      browser.notifications.create(message.options);
      return;
    }

    if (message.type === 'open-popup') {
      // Mở giao diện popup của extension
      try {
        browser.action.openPopup();
      } catch (error) {
        console.error('Không thể mở popup:', error);
        const optionsUrl = browser.runtime.getURL('/options.html');
        browser.tabs.create({ url: optionsUrl });
      }
      return;
    }

    if (message.type === 'validate-configuration') {
      (async () => {
        const settings = await browser.storage.sync.get(null);
        const isConfigValid = !!settings?.apiConfig?.apiKey;

        if (isConfigValid) {
          sendResponse(true);
          return;
        }

        // --- Xử lý cấu hình không hợp lệ ---
        const notificationOptions = {
          type: 'basic' as const,
          title: '[Trợ lý học ngôn ngữ nhập vai] Lỗi cấu hình API',
          message: 'API key chưa được thiết lập. Vui lòng nhấn vào biểu tượng tiện ích để vào trang cài đặt và cấu hình.',
          iconUrl: browser.runtime.getURL('/warning.png'),
        };

        if (message.source === 'user_action') {
          browser.notifications.create(notificationOptions);
        } else {
          // Mặc định là page_load logic
          const { apiKeyNotificationShown } = await browser.storage.session.get(
            'apiKeyNotificationShown',
          );
          if (!apiKeyNotificationShown) {
            browser.notifications.create(notificationOptions);
            await browser.storage.session.set({
              apiKeyNotificationShown: true,
            });
          }
        }
        sendResponse(false);
      })();
      return true;
    }

    // Mở trang options
    if (message.type === 'open-options') {
      const optionsUrl = browser.runtime.getURL('/options.html');
      browser.tabs.create({ url: optionsUrl });
      return;
    }
  });
});
