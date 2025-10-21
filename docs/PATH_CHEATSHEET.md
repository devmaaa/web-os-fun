# Path Configuration Cheat Sheet - DineApp OS

Quick reference for absolute path imports following microkernel architecture.

## 🧠 Core System (@core/*)
```typescript
import { eventBus } from '@core/event-bus';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { configEngine } from '@core/config-engine';
import { authService } from '@core/auth';
import { themeEngine } from '@core/themes';
import { storageEngine } from '@core/storage';
import { telemetry } from '@core/telemetry';
import { cache } from '@core/cache';
import { i18n } from '@core/i18n';
```

## 🖥️ Apps (@apps/*)
```typescript
import OsShell from '@apps/os-shell';
import { DesktopIcons } from '@apps/os-shell/components/DesktopIcons';
import { Taskbar } from '@apps/os-shell/components/Taskbar';
import { WindowManager } from '@apps/os-shell/components/WindowManager';
```

## 🔌 Plugins (@plugins/*)
```typescript
import PosPlugin from '@plugins/pos';
import KdsPlugin from '@plugins/kds';
import CrmPlugin from '@plugins/crm';
import AnalyticsPlugin from '@plugins/analytics';
import InventoryPlugin from '@plugins/inventory';
import MenuPlugin from '@plugins/menu';
import SettingsPlugin from '@plugins/settings';
```

## 🔌 Ports (@ports/*)
```typescript
import { paymentService } from '@ports/payments';
import { notificationService } from '@ports/notifications';
import { databaseService } from '@ports/database';
import { printerService } from '@ports/printers';
```

## 🛠️ Shared Utilities
```typescript
import { useEventBus } from '@composables';
import { formatDate } from '@utils';
import type { WindowProps } from '@types';
import logo from '@assets/logo.png';
```

## 🎨 UI Components
```typescript
import { Button, Modal, Card } from '@ui/components';
import { useTheme } from '@ui/hooks';
import { themeStyles } from '@ui/styles';
```

## Migration Quick Guide
```typescript
// Before ❌
import { windowManager } from '../../../core/window-manager';
import { pluginLoader } from '../../../core/plugin-loader';
import { DesktopIcons } from './components/DesktopIcons';

// After ✅
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { DesktopIcons } from '@apps/os-shell/components/DesktopIcons';
```