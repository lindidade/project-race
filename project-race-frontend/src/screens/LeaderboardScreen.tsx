import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import ApiService from '../services/ApiService';

export default function LeaderboardScreen({ user }: { user: any }) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const data = await ApiService.getLeaderboard();
            setLeaderboard(data);
        } catch (error) {
            Alert.alert('Error', 'Could not load leaderboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaderboard(); }, []);

    const getMedalEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRowStyle = (rank: number, isUser: boolean) => {
        if (isUser) return [styles.row, styles.highlightRow];
        if (rank === 1) return [styles.row, styles.goldRow];
        if (rank === 2) return [styles.row, styles.silverRow];
        if (rank === 3) return [styles.row, styles.bronzeRow];
        return [styles.row];
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#7CB987" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>                    
                    <Text style={styles.title}>Leaderboard</Text>
                    <Text style={styles.subtitle}>Top 10 runners this season 🌿</Text>
                </View>

                {/* List */}
                <View style={styles.card}>
                    {leaderboard.map((entry: any) => {
                        const isUser = entry.userId === user.id;
                        return (
                            <View key={entry.userId} style={getRowStyle(entry.rank, isUser)}>
                                <Text style={styles.rank}>{getMedalEmoji(entry.rank)}</Text>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{entry.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.name}>
                                    {entry.name}{isUser ? ' (You)' : ''}
                                </Text>
                                <Text style={styles.distance}>
                                    {parseFloat(entry.totalDistance).toFixed(1)} km
                                </Text>
                            </View>
                        );
                    })}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAF7' },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF7' },

    header: { marginBottom: 20 },
    backButton: { marginBottom: 8 },
    backButtonText: { color: '#7CB987', fontSize: 16, fontWeight: '600' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#2D4A2D' },
    subtitle: { fontSize: 14, color: '#7A9E7A', marginTop: 4 },

    card: { backgroundColor: '#fff', borderRadius: 20, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },

    row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 4 },
    goldRow: { backgroundColor: '#FFFBEA' },
    silverRow: { backgroundColor: '#F8F8F8' },
    bronzeRow: { backgroundColor: '#FFF5EE' },
    highlightRow: { backgroundColor: '#D4EDDA' },

    rank: { fontSize: 20, width: 40 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4EDDA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: '#3A7D44', fontWeight: 'bold', fontSize: 15 },
    name: { flex: 1, fontSize: 15, color: '#2D4A2D', fontWeight: '500' },
    distance: { fontSize: 15, fontWeight: 'bold', color: '#3A7D44' },
});