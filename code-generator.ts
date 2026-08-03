import { IntentMap } from '../types';

/**
 * Generate a complete React Native + Expo project from an intent map.
 * Produces real, compilable files that can be downloaded as a ZIP.
 */
export function generateReactNativeCode(intentMap: IntentMap): Record<string, string> {
  const files: Record<string, string> = {};
  const appName = intentMap.appName?.replace(/[^a-zA-Z0-9]/g, '') || 'EchoApp';

  // Core project files
  files['package.json'] = generatePackageJson(appName);
  files['app.json'] = generateAppJson(appName);
  files['tsconfig.json'] = generateTsConfig();
  files['babel.config.js'] = generateBabelConfig();
  files['App.tsx'] = generateAppEntry(intentMap, appName);

  // Navigation
  files['src/navigation/AppNavigator.tsx'] = generateNavigator(intentMap, appName);

  // Screens
  intentMap.screens.forEach((screen, i) => {
    const fileName = screen.name.includes('Screen')
      ? screen.name
      : `${screen.name}Screen`;
    files[`src/screens/${fileName}.tsx`] = generateScreen(screen, intentMap, i === 0);
  });

  // Types
  files['src/types/index.ts'] = generateTypes(intentMap);

  // API service
  files['src/services/api.ts'] = generateApiService(intentMap, appName);

  // Theme
  files['src/constants/theme.ts'] = generateTheme();

  // Constants
  files['src/constants/config.ts'] = generateConfig(appName);

  // Generate reusable components
  files['src/components/Button.tsx'] = generateButtonComponent();
  files['src/components/Card.tsx'] = generateCardComponent();
  files['src/components/Input.tsx'] = generateInputComponent();
  files['src/components/Header.tsx'] = generateHeaderComponent(appName);
  files['src/components/Loading.tsx'] = generateLoadingComponent();
  files['src/components/EmptyState.tsx'] = generateEmptyStateComponent();

  // Status badge if status changes detected
  if (intentMap.actions.some(a => a.name.toLowerCase().includes('status'))) {
    files['src/components/StatusBadge.tsx'] = generateStatusBadge();
  }

  return files;
}

function generatePackageJson(appName: string): string {
  return JSON.stringify({
    name: appName.toLowerCase().replace(/[^a-z0-9]/g, ''),
    version: '1.0.0',
    main: 'expo/AppEntry.js',
    scripts: {
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
      lint: 'eslint .',
    },
    dependencies: {
      expo: '~52.0.0',
      'expo-status-bar': '~2.0.0',
      'expo-linking': '~7.0.0',
      'expo-constants': '~17.0.0',
      'expo-font': '~13.0.0',
      'expo-splash-screen': '~0.29.0',
      react: '18.3.1',
      'react-native': '0.76.3',
      'react-native-safe-area-context': '~4.12.0',
      'react-native-screens': '~4.0.0',
      '@react-navigation/native': '^7.0.0',
      '@react-navigation/native-stack': '^7.0.0',
      '@react-navigation/bottom-tabs': '^7.0.0',
      '@expo/vector-icons': '^14.0.0',
      'react-native-gesture-handler': '~2.20.0',
      'react-native-reanimated': '~3.16.0',
    },
    devDependencies: {
      '@babel/core': '^7.24.0',
      '@types/react': '~18.3.0',
      typescript: '~5.3.0',
    },
    private: true,
  }, null, 2);
}

function generateAppJson(appName: string): string {
  return JSON.stringify({
    expo: {
      name: appName,
      slug: appName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'dark',
      splash: {
        backgroundColor: '#0a0a0f',
        resizeMode: 'contain',
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.echoapp.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      },
      android: {
        adaptiveIcon: {
          backgroundColor: '#0a0a0f',
        },
        package: `com.echoapp.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      },
      plugins: [
        'expo-font',
        'expo-splash-screen',
      ],
    },
  }, null, 2);
}

function generateTsConfig(): string {
  return JSON.stringify({
    extends: 'expo/tsconfig.base',
    compilerOptions: {
      strict: true,
      jsx: 'react-jsx',
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      noEmit: true,
    },
    include: ['**/*.ts', '**/*.tsx'],
  }, null, 2);
}

function generateBabelConfig(): string {
  return `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
`;
}

function generateAppEntry(_intentMap: IntentMap, _appName: string): string {
  return `import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
`;
}

function generateNavigator(intentMap: IntentMap, _appName: string): string {
  const screenImports = intentMap.screens.map(s => {
    const name = s.name.includes('Screen') ? s.name : `${s.name}Screen`;
    return `import ${name} from '../screens/${name}';`;
  }).join('\n');

  const screenEntries = intentMap.screens.map(s => {
    const name = s.name.includes('Screen') ? s.name : `${s.name}Screen`;
    const label = s.name.replace(/([A-Z])/g, ' $1').trim();
    return `      <Stack.Screen name="${name}" component={${name}} options={{ title: '${label}' }} />`;
  }).join('\n');

  return `import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';
${screenImports}

export type RootStackParamList = {
${intentMap.screens.map(s => {
  const name = s.name.includes('Screen') ? s.name : `${s.name}Screen`;
  return `  ${name}: undefined;`;
}).join('\n')}
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.foreground,
        headerTitleStyle: { fontWeight: '600' as const },
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
${screenEntries}
    </Stack.Navigator>
  );
}
`;
}

function generateScreen(screen: IntentMap['screens'][0], intentMap: IntentMap, _isFirst: boolean): string {
  const hasStatus = intentMap.actions.some(a => a.name.toLowerCase().includes('status'));
  const hasForms = intentMap.actions.some(a => a.name.toLowerCase().includes('create') || a.name.toLowerCase().includes('add'));
  const modelName = intentMap.models[0]?.name || 'Item';

  return `import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
${hasStatus ? "import StatusBadge from '../components/StatusBadge';" : ''}

// Mock data generated from your recorded workflow
interface ${modelName} {
  id: string;
  title: string;
  createdAt: string;
  ${hasStatus ? "status: 'todo' | 'in_progress' | 'done';" : ''}
}

const MOCK_DATA: ${modelName}[] = [
  { id: '1', title: 'Sample item 1', createdAt: new Date().toISOString()${hasStatus ? ", status: 'todo'" : ''} },
  { id: '2', title: 'Sample item 2', createdAt: new Date().toISOString()${hasStatus ? ", status: 'in_progress'" : ''} },
  { id: '3', title: 'Sample item 3', createdAt: new Date().toISOString()${hasStatus ? ", status: 'done'" : ''} },
];

export default function ${screen.name.includes('Screen') ? screen.name : `${screen.name}Screen`}() {
  const [refreshing, setRefreshing] = useState(false);
  const [data] = useState(MOCK_DATA);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderItem = ({ item }: { item: ${modelName} }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
      <Card style={styles.itemCard}>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {${hasStatus ? '<StatusBadge status={item.status} />' : `<Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />`}}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="${screen.name.replace(/([A-Z])/g, ' $1').trim()}" />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No items yet"
            message="Create your first item to get started"
          />
        }
      />
      ${hasForms ? `
      <View style={styles.fab}>
        <Button title="Create" onPress={() => {}} />
      </View>` : ''}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  itemCard: {
    marginBottom: theme.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
});
`;
}

function generateTypes(intentMap: IntentMap): string {
  const modelTypes = intentMap.models.map(m => {
    const fields = m.fields.map(f =>
      `  ${f.name}: ${f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'};`
    ).join('\n');
    return `export interface ${m.name} {\n${fields}\n}`;
  }).join('\n\n');

  return `// Auto-generated types from Echo AI analysis
// Based on your recorded workflow

${modelTypes}

export type RootStackParamList = {
  ${intentMap.screens.map(s => {
    const name = s.name.includes('Screen') ? s.name : `${s.name}Screen`;
    return `${name}: undefined;`;
  }).join('\n  ')}
};
`;
}

function generateApiService(_intentMap: IntentMap, appName: string): string {
  return `// API service for ${appName}
// Generated by Echo AI — replace placeholder endpoint with your actual API

import { Linking } from 'react-native';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.example.com';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, config);

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'POST', body: data }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: data }),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: data }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export default api;
`;
}

function generateConfig(appName: string): string {
  return `// App configuration for ${appName}
// Generated by Echo AI

export const config = {
  appName: '${appName}',
  version: '1.0.0',
  feedbackEmail: 'feedback@${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com',
  apiTimeout: 10000,
  pageSize: 20,
};
`;
}

function generateTheme(): string {
  return `// Echo AI generated theme — matches the dark purple/blue design system
export const theme = {
  colors: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    accent: '#3b82f6',
    background: '#0a0a0f',
    surface: '#12121a',
    surfaceHover: '#1a1a28',
    foreground: '#f1f1f6',
    muted: '#8b8ba7',
    dim: '#5a5a72',
    border: '#2d2d4a',
    success: '#22c55e',
    warning: '#f59e0b',
    destructive: '#ef4444',
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    small: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
    },
    lg: {
      shadowColor: '#7c3aed',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 6,
    },
  },
};
`;
}

function generateHeaderComponent(_appName: string): string {
  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export default function Header({ title, subtitle, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && <View style={styles.action}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 2,
  },
  action: {
    marginLeft: theme.spacing.md,
  },
});
`;
}

function generateButtonComponent(): string {
  return `import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, style, icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.white : theme.colors.primary}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, styles[\`text_\${variant}\`], styles[\`text_\${size}\`]]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600' },
  text_primary: { color: theme.colors.white },
  text_secondary: { color: theme.colors.foreground },
  text_outline: { color: theme.colors.primary },
  text_ghost: { color: theme.colors.primary },
  text_sm: { fontSize: 13 },
  text_md: { fontSize: 16 },
  text_lg: { fontSize: 18 },
});
`;
}

function generateCardComponent(): string {
  return `import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export default function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  padded: {
    padding: theme.spacing.md,
  },
});
`;
}

function generateInputComponent(): string {
  return `import React from 'react';
import { TextInput, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
}

export default function Input({
  label, placeholder, value, onChangeText,
  multiline, error, secureTextEntry, autoCapitalize, style,
}: InputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.dim}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color: theme.colors.muted,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    color: theme.colors.foreground,
    fontSize: 15,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.destructive,
  },
  error: {
    color: theme.colors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
});
`;
}

function generateLoadingComponent(): string {
  return `import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message, fullScreen }: LoadingProps) {
  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  message: {
    marginTop: 12,
    color: theme.colors.muted,
    fontSize: 14,
  },
});
`;
}

function generateEmptyStateComponent(): string {
  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={theme.colors.dim} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
  },
});
`;
}

function generateStatusBadge(): string {
  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

type Status = 'todo' | 'in_progress' | 'done';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  todo: { label: 'Todo', color: theme.colors.muted, bg: theme.colors.surfaceHover },
  in_progress: { label: 'In Progress', color: theme.colors.warning, bg: '#1a1a0e' },
  done: { label: 'Done', color: theme.colors.success, bg: '#0a1a0e' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
`;
}
