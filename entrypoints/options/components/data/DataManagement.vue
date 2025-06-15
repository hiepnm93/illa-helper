<template>
    <div class="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 class="text-2xl font-bold text-foreground">Data Management</h2>
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-6">
                <div class="space-y-4">
                    <h3 class="text-lg font-medium">Export settings</h3>
                    <p class="text-sm text-muted-foreground">
                        Export all your current settings as a JSON file. You can save this file as a backup or import it on other devices.
                    </p>
                    <Button @click="exportSettings">
                        <Download class="w-4 h-4 mr-2" />
                        Export settings
                    </Button>
                </div>

                <div class="border-t border-border pt-6 space-y-4">
                    <h3 class="text-lg font-medium">Import settings</h3>
                    <p class="text-sm text-muted-foreground">
                        Import settings from json file. Please note: This will override all your current settings.
                    </p>
                    <div class="flex items-center space-x-2">
                        <Input id="import-file" type="file" @change="handleFileSelect" accept=".json"
                            class="max-w-xs" />
                        <Button @click="importSettings" :disabled="!selectedFile">
                            <Upload class="w-4 h-4 mr-2" />
                            Confirm import
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { StorageManager } from '@/src/modules/storageManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-vue-next';

const storageManager = new StorageManager();
const selectedFile = ref<File | null>(null);

const emit = defineEmits<{
    saveMessage: [message: string, type?: 'success' | 'error'];
}>();

const exportSettings = async () => {
    try {
        const settings = await storageManager.getUserSettings();
        const settingsJson = JSON.stringify(settings, null, 2);
        const blob = new Blob([settingsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `illa-helper-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        emit('saveMessage', 'Đã xuất cài đặt thành công!', 'success');
    } catch (error) {
        console.error('Failed to export settings:', error);
        emit('saveMessage', 'Xuất cài đặt thất bại, vui lòng kiểm tra console để biết chi tiết.', 'error');
    }
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0];
    } else {
        selectedFile.value = null;
    }
};

const importSettings = async () => {
    if (!selectedFile.value) {
        emit('saveMessage', 'Vui lòng chọn một file trước.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                throw new Error('无法读取文件内容。');
            }
            const newSettings = JSON.parse(result);
            // 在这里可以添加更严格的设置验证逻辑
            await storageManager.saveUserSettings(newSettings);
            emit(
                'saveMessage',
                'Đã nhập cài đặt thành công! Trang sẽ tự động tải lại để áp dụng thay đổi.',
                'success',
            );
            setTimeout(() => {
                location.reload();
            }, 2000);
        } catch (error) {
            console.error('Failed to import settings:', error);
            emit('saveMessage', 'Nhập thất bại, có thể file không đúng định dạng.', 'error');
        }
    };
    reader.onerror = () => {
        emit('saveMessage', 'Đã xảy ra lỗi khi đọc file.', 'error');
    };
    reader.readAsText(selectedFile.value);
};
</script>