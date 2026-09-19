
/*
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DashboardScreen from './screens/DashboardScreen';
import AccountManagementScreen from './screens/AccountManagementScreen';
import AdminSitesScreen from './screens/AdminSitesScreen'

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontSize: 20 },
        tabBarStyle: { backgroundColor: '#E8F5E9' },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: 'gray',
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
          } else if (route.name === 'Sites') {
            return (
              <MaterialCommunityIcons
                name={focused ? 'pine-tree' : 'pine-tree-outline'}
                size={size}
                color={color}
              />
            );
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <Tab.Screen name="Accounts" component={AccountManagementScreen} options={{ title: 'Manage Accounts' }} />
      <Tab.Screen name="Sites" component={AdminSitesScreen} options={{ title: 'SAPAA Sites' }} />
    </Tab.Navigator>
  );
}
*/ 