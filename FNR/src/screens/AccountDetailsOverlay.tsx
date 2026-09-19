import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, } from 'react-native';
import { User } from '../services/adminAuth';
import { getAccountDetailsOverlayStyles } from './styles/AccountDetailsOverlay.styles';
import { MaterialIcons } from '@expo/vector-icons'; 
import { useTheme } from 'react-native-paper';
import { AppColors } from '../theme/colors';

interface AccountDetailsOverlayProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: { email: string; password?: string; role: string }) => void;
  onDelete?: (id: string) => void;
}

export default function AccountDetailsOverlay({
  visible,
  user,
  onClose,
  onSave,
  onDelete,
}: AccountDetailsOverlayProps) {
  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getAccountDetailsOverlayStyles(appColors), [appColors]);
  const dropdownStyles = useMemo(() => getDropdownStyles(appColors), [appColors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('steward');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleOptions = ['steward', 'admin'];

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role || 'steward');
    } else {
      setEmail('');
      setRole('steward');
    }
    setPassword('');
    setConfirmPassword('');
    setDropdownOpen(false);
  }, [user]);

  const handleSave = () => {
  // Validate password match if user typed a password
  if (password && password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
    }

    // Prepare payload
    const data: { email: string; role: string; password?: string } = { email, role };
    
    // Only include password if user typed something
    if (password) {
        data.password = password;
    }

    onSave(data);
  };


  const handleDelete = () => {
    if (!user || !onDelete) return;
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(user.id),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.modalBackground}>
          <View style={styles.container}>
            <Text style={styles.title}>{user ? 'Edit User' : 'Add New User'}</Text>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter email"
              placeholderTextColor={appColors.textTertiary}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            {/* Role dropdown */}
            <Text style={styles.label}>Role</Text>
            <TouchableOpacity
              style={dropdownStyles.box}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={{ color: role ? appColors.text : appColors.textTertiary }}>{role}</Text>
              <Text style={dropdownStyles.arrow}>▼</Text>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={[dropdownStyles.dropdown, { position: 'absolute', top: 145, left: 25, right: 25, zIndex: 1000 }]}>
                {roleOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={dropdownStyles.item}
                    onPress={() => {
                      setRole(opt);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text style={{ color: appColors.text }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder={user ? 'New password (optional)' : 'Password'}
              placeholderTextColor={appColors.textTertiary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              placeholder={user ? 'Confirm new password' : 'Confirm password'}
              placeholderTextColor={appColors.textTertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            {user && onDelete && (
              <TouchableOpacity style={styles.deleteButton} testID="delete-button" onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={30} color={appColors.error} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getDropdownStyles = (colors: AppColors) => StyleSheet.create({
  box: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.background,
    marginBottom: 10,
  },
  arrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    maxHeight: 150,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
