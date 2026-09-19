import { StyleSheet } from 'react-native';
import { AppColors, LightColors, DarkColors } from '../../theme/colors';

export const getAccountDetailsOverlayStyles = (colors: AppColors) => StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalOverlay,
  },
  container: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text,
  },
  label: {            
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: colors.text,
    backgroundColor: colors.background,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    color: colors.text, 
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: colors.surfaceVariant,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20, // makes it circular
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // ensures it's on top
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default getAccountDetailsOverlayStyles(LightColors);
