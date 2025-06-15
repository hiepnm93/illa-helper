import { defineConfig } from 'wxt';
import removeConsole from 'vite-plugin-remove-console';
import tailwindcss from '@tailwindcss/vite';
// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Trợ lý học ngôn ngữ nhập vai',
    author: {
      email: 'xiao1932794922@gmail.com',
    },
    description:
      'Công cụ học tiếng Anh dựa trên lý thuyết "đầu vào dễ hiểu", giúp bạn học tiếng Anh một cách tự nhiên khi lướt web hàng ngày.',
    version: '1.6.5',
    permissions: ['storage', 'tabs', 'notifications'],
    host_permissions: ['<all_urls>'],
    browser_specific_settings: {
      gecko: {
        id: 'illa-helper@xiao1932794922.gmail.com',
        strict_min_version: '88.0',
      },
    },
  },
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
  vite: (configEnv) => ({
    plugins: [
      tailwindcss(),
      configEnv.mode === 'production'
        ? [removeConsole({ includes: ['log', 'warn'] })]
        : [],
    ],
  }),
});
