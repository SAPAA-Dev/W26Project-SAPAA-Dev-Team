import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme, List, useTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native';
import { createStackNavigator, Header } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import SiteDetailScreen from './src/screens/SiteDetailScreen';
import PDFViewerScreen from './src/screens/PDFViewerScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import AdminSitesScreen from './src/screens/AdminSitesScreen';
import AdminSiteDetailScreen from './src/screens/AdminSiteDetailScreen';
import MapScreen from './src/screens/MapScreen';
import { subscribeToAuth, logout, AuthState } from './src/services/auth';
import { DownloadedSite,  SiteSummary, cleanupExpiredSites, DEFAULT_AUTO_DELETE_DAYS } from './src/services/database';
import DashboardScreen from './src/screens/DashboardScreen';
import AccountManagementScreen from './src/screens/AccountManagementScreen';
import { Text, View, Pressable, Modal, StyleSheet, TouchableWithoutFeedback, Alert, Image, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import globalFunctions from './src/utils/globalFunctions';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Linking from 'expo-linking';
import { PDFFieldConfig } from './src/services/pdfGenerator';
import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';
import { LightColors, DarkColors } from './src/theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Detail: { site: SiteSummary | DownloadedSite };
  PDFViewer: { uri: string };
  AdminDashboard: undefined;
  AdminSiteDetail: { site: SiteSummary};
  Main: undefined;
};

// Logo component for headers
const HeaderLogo = () => (
  <View
    style={{
      height: '100%',             
      justifyContent: 'center',    
      alignItems: 'center',       
    }}
  >
    <Image
      source={require('./src/assets/sappa-full-logo-white.png')}
      style={{ width: 150, height: 33, resizeMode: 'contain' }}
    />
  </View>
);

const HeaderLogoWithSubtitle = ({ subtitle }: { subtitle: string }) => (
  <View
    style={{
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Image
      source={require('./src/assets/sapaa-logo-white.png')}
      style={{ width: 130, height: 30, resizeMode: 'contain' }}
    />
    <Text
      style={{
        marginTop: 2,
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
      }}
      numberOfLines={1}
    >
      {subtitle}
    </Text>
  </View>
);

const HeaderLogoWithTitle = ({ title }: { title?: string }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '100%',
    }}
  >
    <Image
      source={require('./src/assets/sapaa-logo-white.png')}
      style={{ width: 24, height: 24, resizeMode: 'contain' }} // smaller logo
    />
    {title ? (
      <Text
        style={{
          marginLeft: 6,
          color: '#fff',
          fontSize: 100,          // slightly smaller font
          fontWeight: '600',
          flexShrink: 1,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit      // ⬅ shrink to fit before truncating
        minimumFontScale={1.5}    // ⬅ allow it to go a bit smaller
      >
        {title}
      </Text>
    ) : null}
  </View>
);

// Home button component for Admin screens
const AdminHomeButton = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return (
    <TouchableOpacity
      onPress={() => {
        // Reset the navigation stack to Main so no back button appears
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }}
      style={{ marginLeft: 16, padding: 4 }}
    >
      <Ionicons name="home" size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const Tab = createBottomTabNavigator();
const SitesStackNav = createStackNavigator<RootStackParamList>();
const AnalyticsStackNav = createStackNavigator();
const RootStack = createStackNavigator();
const AuthStackNav = createStackNavigator();
const MapStackNav = createStackNavigator();
const AdminTab = createBottomTabNavigator();
const AdminStackNav = createStackNavigator();

// Auth Stack (Login + Signup)
function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={SignupScreen} />
    </AuthStackNav.Navigator>
  );
}

// Sites Stack Navigator
function SitesStack() {
  return (
    <SitesStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontSize: 20 },

        // 🔧 make it behave like Admin header
        headerTitleAlign: 'center',
        headerTitleContainerStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <SitesStackNav.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Sites',
          headerTitle: () => <HeaderLogo />,
        }}
      />
      <SitesStackNav.Screen
        name="Detail"
        component={SiteDetailScreen}
        options={{ title: 'Site Details' }}
      />
      <SitesStackNav.Screen
        name="PDFViewer"
        component={PDFViewerScreen}
        options={{ title: 'Report' }}
      />
    </SitesStackNav.Navigator>
  );
}

// Simple modal-based menu that avoids React Native Paper Menu issues
const AnalyticsHeaderRight = React.memo(() => {
  const [menuVisible, setMenuVisible] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [auth, setAuth] = useState<AuthState | null>(null);

  // Subscribe to auth state
  useEffect(() => {
    const unsub = subscribeToAuth(setAuth);
    return unsub;
  }, []);

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const closeMenu = () => setMenuVisible(false);

  // Navigate to admin or alert if not admin
  const goToAdmin = () => {
    closeMenu();
    if (auth?.user?.role === 'admin') {
      navigation.navigate('AdminDashboard');
    } else {
      Alert.alert('Permission Denied', 'You do not have permission to view this page.');
    }
  };

  const handleLogout = async () => {
    closeMenu();
    setTimeout(async () => {
      await logout();
    }, 100);
  };

  const openSettings = () => {
    closeMenu();
    if (globalFunctions.openSettingsModal) {
      globalFunctions.openSettingsModal();
    } else {
      console.warn('AnalyticsScreen not mounted or openSettingsModal not assigned');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggleMenu}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
                <List.Item
                  title="Admin"
                  onPress={goToAdmin}
                  titleStyle={{ color: theme.colors.onSurface }}
                  left={props => <List.Icon {...props} icon="shield-account" color={theme.colors.onSurface} />}
                  style={styles.menuItem}
                />
                <List.Item
                  title="Settings"
                  onPress={openSettings}
                  titleStyle={{ color: theme.colors.onSurface }}
                  left={props => <List.Icon {...props} icon="tools" color={theme.colors.onSurface} />}
                  style={styles.menuItem}
                />
                <List.Item
                  title="Log out"
                  onPress={handleLogout}
                  titleStyle={{ color: theme.colors.onSurface }}
                  left={props => <List.Icon {...props} icon="logout" color={theme.colors.onSurface} />}
                  style={styles.menuItem}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
});

AnalyticsHeaderRight.displayName = 'AnalyticsHeaderRight';

const styles = StyleSheet.create({
  container: { marginRight: 8 },
  button: { padding: 8, borderRadius: 4 },
  buttonPressed: { opacity: 0.6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: { paddingVertical: 4 },
});

// Analytics Stack
function AnalyticsStack() {
  return (
    <AnalyticsStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontSize: 20 },
      }}
    >
      <AnalyticsStackNav.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          headerTitle: () => <HeaderLogo />,
          headerRight: () => <AnalyticsHeaderRight />,
        }}
      />
    </AnalyticsStackNav.Navigator>
  );
}

// Map Stack
function MapStack() {
  return (
    <MapStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontSize: 20 },
      }}
    >
      <MapStackNav.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerTitle: () => <HeaderLogo />,  
        }}
      />
    </MapStackNav.Navigator>
  );
}

// Admin Tabs - Separate navigation for Admin section
function AdminTabs() {
  const { isDarkMode } = useThemeContext();
  const colors = isDarkMode ? DarkColors : LightColors;

  return (
    <AdminTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',

        // center like other screens, let RN handle width
        headerTitleAlign: 'center',
        headerTitleContainerStyle: {
          flex: 1,              // give it full width
          alignItems: 'center', // center the logo+text view
          justifyContent: 'center',
        },

        // Add home button to left side of header for all admin tabs
        headerLeft: () => <AdminHomeButton />,

        tabBarStyle: {
          backgroundColor: isDarkMode ? colors.surface : '#E8F5E9',
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: isDarkMode ? colors.primary : '#2E7D32',
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Dashboard') {
            return (
              <Ionicons
                name={focused ? 'speedometer' : 'speedometer-outline'}
                size={size}
                color={color}
              />
            );
          } else if (route.name === 'Accounts') {
            return (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={size}
                color={color}
              />
            );
          } else {
            return (
              <MaterialCommunityIcons
                name="pine-tree"
                color={color}
                size={size}
              />
            );
          }
        },
      })}
    >
      <AdminTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Admin Dashboard',
          headerTitle: () => (
            <HeaderLogoWithTitle title="Dashboard" />
          ),
        }}
      />
      <AdminTab.Screen
        name="Accounts"
        component={AccountManagementScreen}
        options={{
          title: 'Accounts',
          headerTitle: () => (
            <HeaderLogoWithTitle title="Accounts" />
          ),
        }}
      />
      <AdminTab.Screen
        name="Sites"
        component={AdminSitesScreen}
        options={{
          title: 'Sites',
          headerTitle: () => (
            <HeaderLogoWithTitle title="Admin Sites" />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
}



// Admin Stack - Wraps the Admin tabs
function AdminStack() {
  return (
    <AdminStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
      }}
    >
      <AdminStackNav.Screen 
        name="AdminTabs" 
        component={AdminTabs} 
        options={{ headerShown: false }} 
      />
      <AdminStackNav.Screen
        name="AdminSiteDetail"
        component={AdminSiteDetailScreen}
        options={{ 
          title: 'Site Details', 
          headerBackTitle: "",
          headerLeft: () => <AdminHomeButton />,
        }}
      />
    </AdminStackNav.Navigator>
  );
}

// Main Tabs - Analytics, Sites, Map
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ tabBarActiveTintColor: '#2E7D32', headerShown: false }}
    >
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStack}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-bar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SitesTab"
        component={SitesStack}
        options={{
          title: 'Sites',
          headerTitleStyle: { fontSize: 20 },
          
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="pine-tree" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{
          title: 'SAPAA Map',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root App
function ThemedAppContent() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const { isDarkMode } = useThemeContext();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received in App:', url);
      if (url.includes('auth/callback')) {
        console.log('Auth callback detected');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuth(setAuth);
    return unsub;
  }, []);

  // Cleanup expired sites on startup and every 24h
  useEffect(() => {
    if (!auth?.isAuthenticated) return;

    const runCleanup = async () => {
      // read clean up settings once on start
      let keepDaysUser = DEFAULT_AUTO_DELETE_DAYS;
      try {
        const stored = await AsyncStorage.getItem('@SAPPA_autoDeleteDays');
        if (stored !== null) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed >= 1) {
            keepDaysUser = parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to read auto-delete setting for cleanup, using default');
      }

      console.log('Running initial expired sites cleanup...');
      await cleanupExpiredSites(keepDaysUser); 

      // Run cleanup every 24 hours
      const interval = setInterval(async () => {
        let intervalKeepDays = DEFAULT_AUTO_DELETE_DAYS;
        try {
          const stored = await AsyncStorage.getItem('@SAPPA_autoDeleteDays');
          if (stored !== null) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed >= 1) {
              intervalKeepDays = parsed;
            }
          }
        } catch (err) {
          console.warn('Failed to read auto-delete setting for daily cleanup');
        }
        console.log('Running scheduled expired sites cleanup...');
        await cleanupExpiredSites(intervalKeepDays);
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(interval);
    };

    runCleanup().catch(err => console.warn('Cleanup failed:', err));
  }, [auth?.isAuthenticated]);

  if (!auth) return null;

  const colors = isDarkMode ? DarkColors : LightColors;

  const paperTheme = {
    ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDarkMode ? MD3DarkTheme.colors : MD3LightTheme.colors),
      ...colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      onPrimary: colors.white,
      onBackground: colors.text,
      outline: colors.border,
      error: colors.error,
      placeholder: colors.textSecondary,
      elevation: {
        level0: 'transparent',
        level1: colors.surface,
        level2: colors.surface,
        level3: colors.surface,
        level4: colors.surface,
        level5: colors.surface,
      },
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer 
        theme={{
          dark: isDarkMode,
          colors: {
            ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.error,
          },
          fonts: isDarkMode ? DarkTheme.fonts : DefaultTheme.fonts,
        }}
      >
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {auth.isAuthenticated ? (
            <>
              {/* Main Tabs */}
              <RootStack.Screen name="Main" component={MainTabs} />

              {/* Admin Dashboard */}
              <RootStack.Screen
                name="AdminDashboard"
                component={AdminStack}
                options={{
                  headerShown: false,     // ⬅ let AdminTabs handle the header + logo
                  presentation: 'card',
                }}
              />
            </>
          ) : (
            <RootStack.Screen name="Auth" component={AuthStack} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedAppContent />
    </ThemeProvider>
  );
}