<template>
  <div class="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
    <!-- 顶部Logo区域 -->
    <div class="h-16 flex items-center px-6 border-b border-sidebar-border">
      <div class="flex items-center space-x-3">
        <img src="/assets/vue.svg" alt="logo" class="w-8 h-8" />
        <div>
          <h1 class="text-lg font-semibold text-sidebar-foreground">
            ILLA Helper
          </h1>
          <p class="text-xs text-sidebar-foreground/60">Trung tâm cài đặt</p>
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 px-4 py-6 overflow-y-auto">
      <div class="space-y-6">
        <!-- 基础功能组 -->
        <NavigationGroup title="Cơ bản" :items="basicFeatures" :current-section="currentSection"
          @section-change="handleSectionChange" />

        <!-- 高级功能组 -->
        <NavigationGroup title="Nâng cao" :items="advancedFeatures" :current-section="currentSection"
          @section-change="handleSectionChange" />

        <!-- 管理工具组 -->
        <NavigationGroup title="Công cụ quản lý" :items="managementTools" :current-section="currentSection"
          @section-change="handleSectionChange" />
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import {
  Settings,
  Languages,
  Shield,
  Circle,
  Download,
  Info,
} from 'lucide-vue-next';
import NavigationGroup from './NavigationGroup.vue';

interface Props {
  currentSection: string;
}

interface NavigationItem {
  key: string;
  label: string;
  icon: any;
  description?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  sectionChange: [section: string];
}>();

// 基础功能组
const basicFeatures: NavigationItem[] = [
  {
    key: 'basic',
    label: 'Cài đặt cơ bản',
    icon: Settings,
    description: 'Cấu hình cơ bản và tuỳ chọn người dùng',
  },
  {
    key: 'floating',
    label: 'Bóng nổi',
    icon: Circle,
    description: 'Cấu hình công cụ bóng nổi',
  },
];

// 高级功能组
const advancedFeatures: NavigationItem[] = [
  {
    key: 'translation',
    label: 'Dịch thuật',
    icon: Languages,
    description: 'Cấu hình API và chiến lược dịch',
  },
];

// 管理工具组
const managementTools: NavigationItem[] = [
  {
    key: 'blacklist',
    label: 'Danh sách chặn',
    icon: Shield,
    description: 'Quản lý danh sách chặn website',
  },
  {
    key: 'data',
    label: 'Nhập/Xuất dữ liệu',
    icon: Download,
    description: 'Sao lưu và khôi phục cấu hình',
  },
  {
    key: 'about',
    label: 'Giới thiệu',
    icon: Info,
    description: 'Thông tin phiên bản và trợ giúp',
  },
];

const handleSectionChange = (section: string) => {
  emit('sectionChange', section);
};
</script>
