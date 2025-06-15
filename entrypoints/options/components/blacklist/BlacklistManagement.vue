<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- 页面标题和描述 -->
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 class="text-2xl font-bold text-foreground">Website blacklist management</h2>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">

        <div class="space-y-2">

          <p class="text-muted-foreground">
            Manage websites that do not need translation. Supports wildcard patterns, such as
            <code class="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-sm">
          *://github.com/*
        </code>
          </p>
        </div>

        <!-- 操作工具栏 -->
        <div class="bg-card rounded-lg border border-border p-4">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <!-- 搜索框 -->
            <div class="flex-1 max-w-md">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input v-model="searchQuery" type="text" placeholder="Search website patterns..."
                  class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex gap-2">
              <button @click="showAddDialog = true"
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
                <Plus class="w-4 h-4" />
                Add website
              </button>

              <button v-if="selectedPatterns.length > 0" @click="bulkDeletePatterns"
                class="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
                <Trash2 class="w-4 h-4" />
                Delete selected ({{ selectedPatterns.length }})
              </button>

              <button @click="exportPatterns"
                class="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
                <Download class="w-4 h-4" />
                Export
              </button>

              <button @click="importPatterns"
                class="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
                <Upload class="w-4 h-4" />
                Import
              </button>
            </div>
          </div>
        </div>

        <!-- 黑名单表格 -->
        <div class="bg-card rounded-lg border border-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="w-12 p-4">
                    <input v-model="selectAll" @change="handleSelectAll" type="checkbox"
                      class="rounded border-border focus:ring-ring" />
                  </th>
                  <th class="text-left p-4 font-medium text-foreground">
                    Website patterns
                  </th>
                  <th class="text-left p-4 font-medium text-foreground">Status</th>
                  <th class="text-left p-4 font-medium text-foreground">
                    Add time
                  </th>
                  <th class="text-right p-4 font-medium text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pattern, index) in filteredPatterns" :key="pattern.url"
                  class="border-t border-border hover:bg-muted/25 transition-colors">
                  <td class="p-4">
                    <input v-model="selectedPatterns" :value="pattern.url" type="checkbox"
                      class="rounded border-border focus:ring-ring" />
                  </td>
                  <td class="p-4">
                    <code class="px-2 py-1 bg-muted rounded text-sm font-mono">
                  {{ pattern.url }}
                </code>
                  </td>
                  <td class="p-4">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Enabled
                    </span>
                  </td>
                  <td class="p-4 text-muted-foreground text-sm">
                    {{ formatDate(pattern.addedAt) }}
                  </td>
                  <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="editPattern(pattern, index)"
                        class="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        title="编辑">
                        <Edit3 class="w-4 h-4" />
                      </button>
                      <button @click="removePattern(pattern.url)"
                        class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="删除">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredPatterns.length === 0" class="text-center py-12">
            <Shield class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-medium text-foreground mb-2">
              {{ searchQuery ? 'No matching websites' : 'Blacklist is empty' }}
            </h3>
            <p class="text-muted-foreground mb-4">
              {{
                searchQuery ? 'Try other search keywords' : 'Start adding websites that do not need translation'
              }}
            </p>
            <button v-if="!searchQuery" @click="showAddDialog = true"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <Plus class="w-4 h-4" />
              Add first website
            </button>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="text-sm text-muted-foreground">
          Total {{ patterns.length }} website patterns
          <span v-if="searchQuery">
            , showing {{ filteredPatterns.length }} matching results
          </span>
        </div>

        <!-- 添加/编辑对话框 -->
        <BlacklistDialog v-if="showAddDialog" :pattern="editingPattern" :is-editing="!!editingPattern"
          @save="handleSavePattern" @cancel="handleCancelEdit" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  Shield,
  Edit3,
} from 'lucide-vue-next';
import { BlacklistManager } from '@/src/modules/options/blacklist/manager';
import BlacklistDialog from './BlacklistDialog.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlacklistPattern {
  url: string;
  addedAt: Date;
  enabled: boolean;
}

const emit = defineEmits<{
  saveMessage: [message: string];
}>();

const manager = new BlacklistManager();
const patterns = ref<BlacklistPattern[]>([]);
const searchQuery = ref('');
const selectedPatterns = ref<string[]>([]);
const selectAll = ref(false);
const showAddDialog = ref(false);
const editingPattern = ref<BlacklistPattern | null>(null);

onMounted(async () => {
  await loadPatterns();
});

const loadPatterns = async () => {
  const rawPatterns = await manager.getPatterns();
  patterns.value = rawPatterns.map((url) => ({
    url,
    addedAt: new Date(), // 实际应该从存储中获取
    enabled: true,
  }));
};

const filteredPatterns = computed(() => {
  if (!searchQuery.value) return patterns.value;
  const query = searchQuery.value.toLowerCase();
  return patterns.value.filter((pattern) =>
    pattern.url.toLowerCase().includes(query),
  );
});

const handleSelectAll = () => {
  if (selectAll.value) {
    selectedPatterns.value = filteredPatterns.value.map((p) => p.url);
  } else {
    selectedPatterns.value = [];
  }
};

const removePattern = async (pattern: string) => {
  if (confirm(`Are you sure you want to delete "${pattern}"?`)) {
    await manager.removePattern(pattern);
    await loadPatterns();
    emit('saveMessage', 'Website has been removed from blacklist');
  }
};

const bulkDeletePatterns = async () => {
  if (confirm(`Are you sure you want to delete the selected ${selectedPatterns.value.length} websites?`)) {
    for (const pattern of selectedPatterns.value) {
      await manager.removePattern(pattern);
    }
    selectedPatterns.value = [];
    selectAll.value = false;
    await loadPatterns();
    emit('saveMessage', 'Selected websites have been deleted');
  }
};

const editPattern = (pattern: BlacklistPattern, index: number) => {
  editingPattern.value = { ...pattern };
  showAddDialog.value = true;
};

const handleSavePattern = async (pattern: BlacklistPattern) => {
  const isEditing = !!editingPattern.value;

  if (isEditing) {
    // 编辑模式：先删除旧的模式
    await manager.removePattern(editingPattern.value!.url);
  }

  // 添加新的模式
  await manager.addPattern(pattern.url);
  await loadPatterns();
  showAddDialog.value = false;
  editingPattern.value = null;

  emit('saveMessage', isEditing ? 'Website pattern has been updated' : 'Website has been added to blacklist');
};

const handleCancelEdit = () => {
  showAddDialog.value = false;
  editingPattern.value = null;
};

const exportPatterns = () => {
  try {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      patterns: patterns.value.map((p) => ({
        url: p.url,
        addedAt: p.addedAt.toISOString(),
        enabled: p.enabled,
      })),
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blacklist-patterns-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    emit('saveMessage', `Exported ${patterns.value.length} website patterns`);
  } catch (e) {
    console.error(e);
  }
};

const importPatterns = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        let patternsToImport: string[] = [];

        // 检查导入数据格式
        if (Array.isArray(importedData)) {
          // 旧格式：直接是字符串数组
          patternsToImport = importedData.filter(
            (item) => typeof item === 'string',
          );
        } else if (
          importedData.patterns &&
          Array.isArray(importedData.patterns)
        ) {
          // 新格式：包含完整数据的对象
          patternsToImport = importedData.patterns
            .map((p: any) => p.url || p)
            .filter(Boolean);
        } else {
          throw new Error('Invalid file format');
        }

        if (patternsToImport.length === 0) {
          emit('saveMessage', 'No valid website patterns found in the imported file');
          return;
        }

        // 检查重复项
        const existingPatterns = patterns.value.map((p) => p.url);
        const newPatterns = patternsToImport.filter(
          (pattern) => !existingPatterns.includes(pattern),
        );
        const duplicateCount = patternsToImport.length - newPatterns.length;

        // 导入新模式
        for (const pattern of newPatterns) {
          await manager.addPattern(pattern);
        }

        await loadPatterns();

        let message = `Imported ${newPatterns.length} website patterns`;
        if (duplicateCount > 0) {
          message += `, skipped ${duplicateCount} duplicate items`;
        }
        emit('saveMessage', message);
      } catch (error) {
        console.error('Import failed:', error);
        emit('saveMessage', 'Import failed: Invalid file format or contains error data');
      }
    }
  };
  input.click();
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>
