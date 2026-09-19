import React, { memo, useMemo, useCallback } from 'react';
import { View, Text as RNText, TouchableOpacity } from 'react-native';
import { Checkbox, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { daysSince, formateAgeBadge, badgeColor } from '../screens/HomeScreen';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { AppColors } from '../theme/colors';

// define props
interface SiteListItemProps {
    item: {
        id: number;
        namesite: string;
        county: string | null;
        inspectdate: string | null;
    };
    isSelected: boolean;
    isDownloaded: boolean;
    onPress: () => void;
    onToggleSelect: (siteName: string) => void;
    styles: any;
    appColors: AppColors;
}

// react.memo to avoid unnecessay re-rendering
const SiteListItem = memo(({ item, isSelected, isDownloaded, onPress, onToggleSelect, styles, appColors }: SiteListItemProps) => {
    // compute values only when this specific item renders
    const age = useMemo(() => daysSince(item.inspectdate ?? '1900-01-01'), [item.inspectdate]);
    const ageText = useMemo(() => formateAgeBadge(age), [age]);
    const badgeColorValue = useMemo(() => badgeColor(age), [age]);

    const handleToggle = useCallback((e: any) => {
        e.stopPropagation();
        onToggleSelect(item.namesite);
    }, [onToggleSelect, item.namesite]);
    
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.card}
        >
            <View style={styles.cardContent}>
                {/* checkbox */}
                <View style={styles.checkboxContainer}>
                    <Checkbox
                        status={isSelected ? 'checked' : 'unchecked'}
                        onPress={handleToggle}
                    />
                </View>

                {/* site info */}
                <View style={styles.textContainer}>
                    <RNText style={styles.siteName} numberOfLines={2}>
                        {item.namesite}
                    </RNText>
                    {item.county ? (
                        <View style={styles.countyContainer}>
                            <MaterialCommunityIcons
                                name='map-marker-outline'
                                size={14}
                                color={appColors.textSecondary}
                                style={styles.countyIcon}
                            />
                            <RNText style={styles.county}>
                                {item.county}
                            </RNText>
                        </View>
                    ) : null}

                    {/* last inspection date */}
                    <View style={styles.lastInspection}>
                        <MaterialCommunityIcons
                            name='calendar'
                            size={14}
                            color={appColors.textTertiary}
                            style={styles.lastInspectionIcon}
                        />
                        <RNText style={styles.lastInspection}>
                            Last Inspection: {item.inspectdate ? new Date(item.inspectdate).toLocaleDateString() : 'N/A'}
                        </RNText>
                    </View>
                </View>

                {/* badges */}
                <View style={styles.badgesContainer}>
                    {isDownloaded && (
                        <MaterialCommunityIcons
                            name='download-circle'
                            size={20}
                            color='#4CAF50'
                            style={styles.downloadedIcon}
                        />
                    )}
                    <Badge style={[styles.badge, { backgroundColor: badgeColorValue }]} size={28}>
                        {ageText}
                    </Badge> 
                </View>
            </View>

            {/* chevron arrow */}
            <MaterialCommunityIcons
                name='chevron-right'
                size={24}
                color={appColors.icon}
                style={styles.chevron}
            />
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // only re-render if these change
    return prevProps.item.id === nextProps.item.id && 
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isDownloaded === nextProps.isDownloaded &&
        prevProps.onPress === nextProps.onPress &&
        prevProps.onToggleSelect === nextProps.onToggleSelect &&
        prevProps.styles === nextProps.styles &&
        prevProps.appColors === nextProps.appColors;
});

export default SiteListItem;