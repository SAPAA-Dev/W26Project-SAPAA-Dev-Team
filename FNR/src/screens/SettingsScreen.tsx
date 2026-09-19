import React, {useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_AUTO_DELETE_DAYS } from '../services/database';
import { useThemeContext } from '../context/ThemeContext';
import { Switch, useTheme } from 'react-native-paper';

// key for AsyncStorage
const AUTO_DELETE_DAYS_KEY = '@SAPPA_autoDeleteDays';

interface SettingsModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSave: (days: number) => void; // save when there is a new setting
}

export default function SettingsModal({ visible, onDismiss, onSave }: SettingsModalProps) {
    const [autoDeleteDays, setAutoDeleteDays] = useState<string>(DEFAULT_AUTO_DELETE_DAYS.toString());
    const { isDarkMode, toggleTheme } = useThemeContext();
    const theme = useTheme();

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedDays = await AsyncStorage.getItem(AUTO_DELETE_DAYS_KEY);
                if (storedDays !== null ) {
                    setAutoDeleteDays(storedDays);
                }
            } catch (error) {
                console.error('Error loading auto-delete setting:', error);
                Alert.alert('Error', 'Could not load settings. Using default');
                setAutoDeleteDays(DEFAULT_AUTO_DELETE_DAYS.toString()); // fallback to defualt
            }
        };

        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const handleSave = async () => {
        try {
            // save auto delete days
            const parsedDays = parseInt(autoDeleteDays, 10);
            if (isNaN(parsedDays) || parsedDays < 1) {
                Alert.alert('Invalid Input', 'Please enter a valid number of days (1 or more).');
                return;
            }
            await AsyncStorage.setItem(AUTO_DELETE_DAYS_KEY, parsedDays.toString());
            console.log(`Auto-delete period set to ${parsedDays} days.`);
            onSave(parsedDays); // save
            onDismiss(); // close modal
        } catch (error) {
            console.error('Error saving auto-delete setting:', error);
            Alert.alert('Error', 'Could not save settings');
        }
    };

    const handleCancel = () => {
        onDismiss();
    };

    return (
        <Modal
            animationType='slide'
            transparent={true}
            visible={visible}
            onRequestClose={onDismiss}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Settings</Text>

                    {/* Dark mode toggle */}
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, {color: theme.colors.onSurface}]}>Dark Mode</Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={isDarkMode ? theme.colors.onPrimary: '#f4f3f4'}
                        />
                    </View>

                    {/* Auto-delete setting */}
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Auto-delete Offline Data (Days)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
                            value={autoDeleteDays}
                            onChangeText={setAutoDeleteDays}
                            keyboardType='numeric'
                            placeholder='Days'
                            placeholderTextColor={theme.colors.onSurfaceDisabled}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
                            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        borderRadius: 8,
        padding: 20, 
        width: '80%',
        maxWidth: 400,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    settingLabel: {
        fontSize: 16,
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
        width: 80,
        textAlign: 'center',
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row', 
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#9E9E9E',
    },
    saveButton: {
        // backgroundColor set dynamically
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

