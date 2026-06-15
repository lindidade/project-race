import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type Screen = 'dashboard' | 'friends' | 'leaderboard' | 'competition';

interface BottomNavProps {
    activeScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
    const tabs = [
        { screen: 'dashboard' as Screen, label: 'Home', icon: 'home', iconActive: 'home' },
        { screen: 'friends' as Screen, label: 'Friends', icon: 'people-outline', iconActive: 'people' },
        { screen: 'leaderboard' as Screen, label: 'Leaderboard', icon: 'trophy-outline', iconActive: 'trophy' },
        { screen: 'competition' as Screen, label: 'Competitions', icon: 'flag-outline', iconActive: 'flag' },
    ];

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeScreen === tab.screen;
                return (
                    <TouchableOpacity
                        key={tab.screen}
                        style={styles.tab}
                        onPress={() => onNavigate(tab.screen)}
                    >
                        <Ionicons
                            name={isActive ? tab.iconActive : tab.icon as any}
                            size={24}
                            color={isActive ? Colors.primary : Colors.textLight}
                        />
                        <Text style={[styles.label, isActive && styles.labelActive]}>
                            {tab.label}
                        </Text>
                        {isActive && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    label: { fontSize: 11, color: Colors.textLight, marginTop: 3 },
    labelActive: { color: Colors.primary, fontWeight: '600' },
    activeIndicator: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: Colors.primary, marginTop: 3
    },
});