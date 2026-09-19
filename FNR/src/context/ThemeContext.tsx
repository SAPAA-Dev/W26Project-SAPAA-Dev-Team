import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@SAPPA_theme';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error ('useThemeContext error');
    return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        Appearance.getColorScheme() === 'dark'
    );

    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setIsDarkMode(colorScheme === 'dark');
        });
        loadThemePreference();
        return () => sub.remove();
    }, []);

    const loadThemePreference = async () => {
        try {
            const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (storedTheme !== null) {
                setIsDarkMode(storedTheme === 'dark');
            }
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
        }
    };

    const toggleTheme = async () => {
        const newValue = !isDarkMode;
        setIsDarkMode(newValue);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newValue ? 'dark' : 'light');
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};