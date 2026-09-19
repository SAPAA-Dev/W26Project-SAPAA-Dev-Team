export interface AppColors {
    primary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    icon: string;
    white: string;
    modalOverlay: string;
    searchBarBg: string;
}

export const LightColors: AppColors = {
    primary: '#2E7D32',
    background: '#F3F4F6', // Light gray background
    surface: '#FFFFFF',
    surfaceVariant: '#E5E7EB',
    text: '#111827', // Dark gray/black for text
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    error: '#DC2626',
    success: '#4CAF50',
    warning: '#F59E0B',
    icon: '#6B7280',
    white: '#FFFFFF',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    searchBarBg: 'rgba(0,0,0,0.03)',
};

export const DarkColors: AppColors = {
    primary: '#4CAF50', // Lighter green for dark mode
    background: '#121212', // Very dark gray/black
    surface: '#1E1E1E', // Slightly lighter for cards/modals
    surfaceVariant: '#2C2C2C',
    text: '#FFFFFF', // White for text
    textSecondary: '#E5E7EB',
    textTertiary: '#9CA3AF',
    border: '#374151',
    error: '#EF4444',
    success: '#66BB6A',
    warning: '#FBBF24',
    icon: '#9CA3AF',
    white: '#FFFFFF',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    searchBarBg: 'rgba(255,255,255,0.1)',
};
