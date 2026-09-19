import { StyleSheet, Platform } from 'react-native';
import { AppColors, LightColors, DarkColors } from '../../theme/colors';

export const getAccountManagementStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Main title
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: colors.text,
  },

  // Search + sort row
  searchSortContainer: {
    marginTop: 15,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.background, // subtle grey
  },

  // Search input: match main app search bar
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  // Sort button: white container, subtle shadow
  sortButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: colors.surfaceVariant || '#eee',
    borderRadius: 8,
  },

  // User item card: white container, subtle shadow
  userItem: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    ...Platform.select({
      android: { elevation: 0 },
      ios: { shadowColor: 'transparent', shadowOpacity: 0, shadowOffset: { width: 0, height: 0 }, shadowRadius: 0 },
    }),
  },

  // User text
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  userRole: {
    color: colors.textSecondary,
  },

  // Floating add button
  addButton: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: colors.primary,
    borderRadius: 50,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2 },
    }),
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal content
  modalContent: {
    width: 250,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...Platform.select({
      android: { elevation: 0 },
      ios: { shadowColor: 'transparent', shadowOpacity: 0, shadowOffset: { width: 0, height: 0 }, shadowRadius: 0 },
    }),
  },

  // Modal option row
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  modalSortIcon: {
    marginRight: 8,
  },

  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },

  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
});

export default getAccountManagementStyles(LightColors);
