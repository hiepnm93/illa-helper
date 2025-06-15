<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 class="text-2xl font-bold text-foreground">Cài đặt dịch vụ dịch</h2>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-2">
          <Label for="api-key">API Key</Label>
          <Input id="api-key" type="password" v-model="settings.apiConfig.apiKey" placeholder="Nhập API Key của bạn" />
        </div>
        <div class="space-y-2">
          <Label for="api-endpoint">API Endpoint</Label>
          <Input id="api-endpoint" type="text" v-model="settings.apiConfig.apiEndpoint" placeholder="Nhập địa chỉ API endpoint" />
        </div>
        <div class="space-y-2">
          <Label for="api-model">Tên mô hình AI</Label>
          <Input id="api-model" type="text" v-model="settings.apiConfig.model" placeholder="Nhập tên mô hình AI, ví dụ: gpt-4, gpt-3.5-turbo" />
        </div>
        <div class="space-y-2">
          <Label for="temperature">Tham số nhiệt (Temperature: {{ settings.apiConfig.temperature }})</Label>
          <Slider id="temperature" :model-value="[settings.apiConfig.temperature]"
            @update:model-value="settings.apiConfig.temperature = ($event || [0.7])[0]" :min="0" :max="2" :step="0.1" />
          <p class="text-sm text-muted-foreground">Giá trị thấp sẽ bảo thủ hơn, giá trị cao sẽ sáng tạo hơn</p>
        </div>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Label for="enable-thinking">Bật chế độ suy nghĩ</Label>
            <p class="text-sm text-muted-foreground">Cho phép AI suy nghĩ trước khi dịch</p>
          </div>
          <Switch id="enable-thinking" v-model="settings.apiConfig.enable_thinking" />
        </div>

      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { StorageManager } from '@/src/modules/storageManager';
import { UserSettings, DEFAULT_SETTINGS } from '@/src/modules/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const settings = ref<UserSettings>(DEFAULT_SETTINGS);
const storageManager = new StorageManager();

const emit = defineEmits<{
  saveMessage: [message: string];
}>();

onMounted(async () => {
  settings.value = await storageManager.getUserSettings();
});

watch(
  settings,
  async (newSettings) => {
    await storageManager.saveUserSettings(newSettings);
    emit('saveMessage', 'Cài đặt đã được lưu');
    browser.runtime.sendMessage({
      type: 'settings_updated',
      settings: newSettings,
    });
  },
  { deep: true },
);
</script>
