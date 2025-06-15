<template>
    <div class="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 class="text-2xl font-bold text-foreground">Về Trợ lý học ngôn ngữ nhập vai (ILLA Helper)</h2>
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="flex items-center space-x-4">
                    <img src="/assets/logo.png" alt="ILLA Helper Logo" class="w-16 h-16" />
                    <div>
                        <h3 class="text-lg font-semibold">Trợ lý học ngôn ngữ nhập vai (ILLA Helper)</h3>
                        <p class="text-sm text-muted-foreground">Version {{ extensionVersion }}</p>
                    </div>
                </div>
                <div class="prose prose-sm max-w-none text-foreground">
                    <p>
                        Trợ lý học ngôn ngữ nhập vai (ILLA Helper) là một tiện ích mở rộng trình duyệt dựa trên lý
                        thuyết 'i+1' đầu vào dễ hiểu, giúp bạn học ngoại ngữ dễ dàng, hiệu quả qua hệ sinh thái dịch và
                        phát âm nhập vai khi lướt web hàng ngày.
                    </p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 class="text-xl font-bold text-foreground">Core functions</h2>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul class="list-disc space-y-2 pl-5 text-sm text-foreground">
                    <li>
                        <strong>Dịch thông minh & Thay thế từ vựng:</strong> Hỗ trợ hơn 20 ngôn ngữ, tự động lựa chọn từ
                        vựng phù hợp với trình độ của bạn.
                    </li>
                    <li>
                        <strong>Hệ sinh thái học phát âm:</strong> Tích hợp phiên âm, giải thích nghĩa bằng AI và đọc
                        song song bằng hai hệ thống TTS, mang lại trải nghiệm học phát âm toàn diện.
                    </li>
                    <li>
                        <strong>Nhiều phong cách học tập:</strong> Cung cấp 7 kiểu dịch khác nhau (như gạch chân, tô
                        sáng, làm mờ, v.v.), đáp ứng nhu cầu học tập cá nhân hóa.
                    </li>
                    <li>
                        <strong>Khung nổi tương tác:</strong> Di chuột để xem chi tiết phát âm và nghĩa của từ/cụm từ,
                        hỗ trợ tra cứu lồng nhau.
                    </li>
                </ul>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 class="text-xl font-bold text-foreground">Support and feedback</h2>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p class="text-sm text-muted-foreground">
                    Your support is our driving force for continuous improvement! If you find this extension useful,
                    please give us a star on GitHub or participate in development.
                </p>
                <div class="mt-4 flex flex-wrap gap-2">
                    <a href="https://github.com/xiao-zaiyi/illa-helper" target="_blank">
                        <Button>⭐ Star on GitHub</Button>
                    </a>
                    <a href="https://github.com/xiao-zaiyi/illa-helper/issues" target="_blank">
                        <Button variant="outline">Report a problem</Button>
                    </a>
                    <a href="https://github.com/xiao-zaiyi/illa-helper/pulls" target="_blank">
                        <Button variant="outline">Participate in contribution</Button>
                    </a>
                </div>
            </CardContent>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const extensionVersion = ref('N/A');

onMounted(() => {
    // 在浏览器扩展中，我们可以通过 browser.runtime.getManifest() 获取 manifest.json 的内容
    try {
        const manifest = browser.runtime.getManifest();
        extensionVersion.value = manifest.version;
    } catch (error) {
        console.error("Unable to get the extension version number:", error);
        // 在非扩展环境或开发服务器中，这可能会失败。可以设置一个默认值。
        extensionVersion.value = 'DEV';
    }
});
</script>