import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Screen = 'dashboard' | 'friends' | 'leaderboard' | 'competition';

interface BottomNavProps {
    activeScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
    const tabs = [
        { screen: 'dashboard' as Screen, label: 'Home', icon: '🏠' },
        { screen: 'friends' as Screen, label: 'Friends', icon: '👥' },
        { screen: 'leaderboard' as Screen, label: 'Leaderboard', icon: '🏆' },
        { screen: 'competition' as Screen, label: 'Competitions', icon: '🏁' },
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
                        <Text style={styles.icon}>{tab.icon}</Text>
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
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#E8EDE8',
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    icon: { fontSize: 22, marginBottom: 3 },
    label: { fontSize: 11, color: '#A8B8A0' },
    labelActive: { color: '#4A6741', fontWeight: '600' },
    activeIndicator: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: '#4A6741', marginTop: 3
    },
});