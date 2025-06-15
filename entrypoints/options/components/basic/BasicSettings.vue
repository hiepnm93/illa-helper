<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 class="text-2xl font-bold text-foreground">Cài đặt cơ bản</h2>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Label for="extension-enabled">Bật/tắt tiện ích mở rộng</Label>
            <p class="text-xs text-muted-foreground">
              Đóng sẽ tắt toàn bộ chức năng dịch.
            </p>
          </div>
          <Switch id="extension-enabled" :model-value="settings.isEnabled"
            @update:model-value="settings.isEnabled = $event" />
        </div>
        <div class="border-t border-border pt-6">
          <Label class="text-sm mb-2">Vị trí dịch</Label>
          <RadioGroup :model-value="settings.translationPosition" @update:model-value="
            settings.translationPosition = $event as TranslationPosition
            " class="mt-2 flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="pos-after" value="after" />
              <Label for="pos-after">Sau từ</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="pos-before" value="before" />
              <Label for="pos-before">Trước từ</Label>
            </div>
          </RadioGroup>
        </div>
        <div class="flex items-center justify-between">
          <Label for="show-parentheses">Hiển thị dấu ngoặc cho bản dịch</Label>
          <Switch id="show-parentheses" :model-value="settings.showParentheses"
            @update:model-value="settings.showParentheses = $event" />
        </div>
        <div>
          <Label for="translation-style" class="mb-3">Kiểu hiển thị bản dịch</Label>
          <Select :model-value="settings.translationStyle" @update:model-value="
            settings.translationStyle = $event as TranslationStyle
            ">
            <SelectTrigger>
              <SelectValue placeholder="Chọn kiểu hiển thị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Mặc định</SelectItem>
              <SelectItem value="subtle">Nhẹ nhàng</SelectItem>
              <SelectItem value="bold">Đậm</SelectItem>
              <SelectItem value="italic">Nghiêng</SelectItem>
              <SelectItem value="underlined">Gạch chân</SelectItem>
              <SelectItem value="highlighted">Tô sáng</SelectItem>
              <SelectItem value="dotted">Chấm bi</SelectItem>
              <SelectItem value="learning">Chế độ học</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardContent>
        <div class="bg-muted p-4 rounded-lg">
          <div class="flex items-center text-sm text-foreground">
            <span>Đây là một đoạn ví dụ, bao gồm</span>
            <template v-if="settings.translationPosition === 'before'">
              <span :class="[currentStyleClass, 'mx-1']">
                {{ previewTranslation }}
              </span>
              <span class="px-2 py-0.5 bg-background border rounded-md text-sm mx-1">
                Nguyên bản
              </span>
            </template>
            <template v-else>
              <span class="px-2 py-0.5 bg-background border rounded-md text-sm mx-1">
                Nguyên bản
              </span>
              <span :class="[currentStyleClass, 'mx-1']">
                {{ previewTranslation }}
              </span>
            </template>
            <span>。</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>
          <h2 class="text-xl font-bold text-foreground">Cài đặt nâng cao</h2>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-2">
          <Label>Kích hoạt chế độ</Label>
          <RadioGroup :model-value="settings.triggerMode" @update:model-value="settings.triggerMode = $event as any"
            class="flex items-center space-x-4 pt-2">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="mode-auto" value="automatic" />
              <Label for="mode-auto">Tự động dịch</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="mode-manual" value="manual" />
              <Label for="mode-manual">Kích hoạt thủ công</Label>
            </div>
          </RadioGroup>
        </div>
        <div class="space-y-2">
          <Label for="max-length">Độ dài tối đa xử lý</Label>
          <Input id="max-length" type="number" :model-value="settings.maxLength"
            @update:model-value="settings.maxLength = Number($event)" placeholder="Ví dụ: 400" />
        </div>
        <div class="space-y-2">
          <Label for="user-level">Độ quen thuộc từ ({{ getUserLevelLabel(settings.userLevel) }})</Label>
          <Slider id="user-level" :model-value="[settings.userLevel]"
            @update:model-value="settings.userLevel = ($event || [1])[0]" :min="1" :max="5" :step="1" />
        </div>
        <div class="space-y-2">
          <Label for="replacement-rate">Tỷ lệ thay thế (Replacement Rate:</Label>
          <Slider id="replacement-rate" :model-value="[settings.replacementRate]" @update:model-value="
            settings.replacementRate = ($event || [0])[0]
            " :min="0" :max="1" :step="0.01" />
        </div>
        <div class="border-t border-border pt-6 flex items-center justify-between">
          <div class="space-y-1">
            <Label for="enable-pronunciation">Bật khung phát âm</Label>
          </div>
          <Switch id="enable-pronunciation" :model-value="settings.enablePronunciationTooltip"
            @update:model-value="settings.enablePronunciationTooltip = $event" />
        </div>

      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { StorageManager } from '@/src/modules/storageManager';
import { StyleManager } from '@/src/modules/styleManager';
import {
  UserSettings,
  DEFAULT_SETTINGS,
  TranslationPosition,
  TranslationStyle,
} from '@/src/modules/types';
import { getUserLevelLabel } from '@/src/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const settings = ref<UserSettings>(DEFAULT_SETTINGS);
const storageManager = new StorageManager();
const styleManager = new StyleManager();

const emit = defineEmits<{
  saveMessage: [message: string];
}>();

onMounted(async () => {
  settings.value = await storageManager.getUserSettings();
});

const previewTranslation = computed(() => {
  if (settings.value.showParentheses) {
    return '(Dịch)';
  }
  return 'Dịch';
});

const currentStyleClass = computed(() => {
  if (settings.value.translationStyle === TranslationStyle.LEARNING) {
    return 'wxt-translation-term--learning';
  }
  return `wxt-style-${settings.value.translationStyle}`;
});

watch(
  settings,
  async (newSettings) => {
    await storageManager.saveUserSettings(newSettings);
    emit('saveMessage', 'Đã lưu cài đặt');
    browser.runtime.sendMessage({
      type: 'settings_updated',
      settings: newSettings,
    });
  },
  { deep: true },
);
</script>
