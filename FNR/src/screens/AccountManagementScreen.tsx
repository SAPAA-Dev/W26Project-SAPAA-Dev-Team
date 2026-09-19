import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl, Alert, Modal,} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllUsers, addUser, updateUser, deleteUser, User } from '../services/adminAuth';
import AccountDetailsOverlay from './AccountDetailsOverlay';
import { getAccountManagementStyles } from './styles/AccountManagementScreen.styles';
import { useTheme } from 'react-native-paper';
import { AppColors } from '../theme/colors';

export default function AccountManagementScreen() {
  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getAccountManagementStyles(appColors), [appColors]);

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<string | null>(null);

  const loadUsers = async () => {
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (data: { email: string; password: string; role: string }) => {
    const result = await addUser(data);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to add user');
      return;
    }
    setAddModalVisible(false);
    loadUsers();
  };

  const handleUpdateUser = async (data: { email: string; password?: string; role: string }) => {
    if (!editUser) return;
    const payload = {
      id: editUser.id,
      email: data.email,
      role: data.role,
      ...(data.password && { password: data.password }),
    };
    const result = await updateUser(payload);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to update user');
      return;
    }
    setEditUser(null);
    loadUsers();
  };

  const handleDeleteUser = async (id: string) => {
    const result = await deleteUser(id);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to delete user');
      return;
    }
    setEditUser(null);
    loadUsers();
  };

  // Filter users by search query (email only)
  let displayedUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sort/filter options
  if (sortOption === 'emailAsc') {
    displayedUsers = [...displayedUsers].sort((a, b) => a.email.localeCompare(b.email));
  } else if (sortOption === 'emailDesc') {
    displayedUsers = [...displayedUsers].sort((a, b) => b.email.localeCompare(a.email));
  } else if (sortOption === 'stewardOnly') {
    displayedUsers = displayedUsers.filter(u => u.role === 'steward');
  } else if (sortOption === 'adminOnly') {
    displayedUsers = displayedUsers.filter(u => u.role === 'admin');
  }

  return (
    <View style={styles.container}>

      {/* Search Bar + Sort Button */}
      <View style={styles.searchSortContainer}>
        <TextInput
          placeholder="Search by email..."
          placeholderTextColor={appColors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={styles.sortButton}
          testID="sort-button"
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color={appColors.text} />
        </TouchableOpacity>
      </View>

      {/* User List */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 15 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={loadUsers}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }
      >
        {displayedUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users found.</Text>
        ) : (
          displayedUsers.map(u => (
            <TouchableOpacity
              key={u.id}
              onPress={() => setEditUser(u)}
              style={styles.userItem}
            >
              <Text style={styles.userEmail}>{u.email}</Text>
              <Text style={styles.userRole}>Role: {u.role || 'viewer'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setAddModalVisible(true)}
        style={styles.addButton}
        testID="add-button"
      >
        <Text style={{ fontSize: 32, color: appColors.white, marginTop: -2 }}>+</Text>
      </TouchableOpacity>

      {/* Add User Modal */}
      {addModalVisible && (
        <AccountDetailsOverlay
          visible={addModalVisible}
          user={null}
          onClose={() => setAddModalVisible(false)}
          onSave={data => handleAddUser(data as { email: string; password: string; role: string })}
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <AccountDetailsOverlay
          visible={!!editUser}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={data => handleUpdateUser(data)}
          onDelete={id => handleDeleteUser(id)}
        />
      )}

      {/* Sort/Filter Modal */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setSortModalVisible(false)}
          activeOpacity={1}
          testID="sort-modal-overlay"
        >
          <View style={styles.modalContent}>
            <SortFilterOption
              iconName="sort-alphabetical-ascending"
              label="Email (A-Z)"
              onPress={() => { setSortOption('emailAsc'); setSortModalVisible(false); }}
              color={appColors.text}
              styles={styles}
            />
            <SortFilterOption
              iconName="sort-alphabetical-descending"
              label="Email (Z-A)"
              onPress={() => { setSortOption('emailDesc'); setSortModalVisible(false); }}
              color={appColors.text}
              styles={styles}
            />
            <SortFilterOption
              iconName="account-star"
              label="Stewards"
              onPress={() => { setSortOption('stewardOnly'); setSortModalVisible(false); }}
              color={appColors.text}
              styles={styles}
            />
            <SortFilterOption
              iconName="account-tie"
              label="Admins"
              onPress={() => { setSortOption('adminOnly'); setSortModalVisible(false); }}
              color={appColors.text}
              styles={styles}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Sort/Filter Option Component
const SortFilterOption = ({ iconName, label, onPress, color, styles }: { iconName: string; label: string; onPress: () => void; color: string; styles: any }) => (
  <TouchableOpacity style={styles.optionContainer} onPress={onPress}>
    <MaterialCommunityIcons
      name={iconName as any}
      size={20}
      color={color}
      style={styles.modalSortIcon}
    />
    <Text style={styles.modalItemText}>{label}</Text>
  </TouchableOpacity>
);
