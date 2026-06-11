import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import ApiService from '../services/ApiService';

export default function LeaderboardScreen({ user, onBack }: { user: any, onBack: () => void }) {
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🏆 Leaderboard</Text>
            <Text style={styles.subtitle}>Top 10 runners</Text>

            {leaderboard.map((entry: any) => (
                <View key={entry.userId} style={[
                    styles.row,
                    entry.userId === user.id && styles.highlightRow
                ]}>
                    <Text style={styles.rank}>{getMedalEmoji(entry.rank)}</Text>
                    <Text style={styles.name}>
                        {entry.name} {entry.userId === user.id ? '(You)' : ''}
                    </Text>
                    <Text style={styles.distance}>{parseFloat(entry.totalDistance).toFixed(1)} km</Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backButton: { marginBottom: 15 },
    backButtonText: { color: '#2B6CB0', fontSize: 16, fontWeight: '600' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#718096', marginBottom: 25 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    highlightRow: { backgroundColor: '#C6F6D5', borderColor: '#4CAF50' },
    rank: { fontSize: 20, width: 45 },
    name: { flex: 1, fontSize: 16, color: '#1A202C', fontWeight: '500' },
    distance: { fontSize: 16, fontWeight: 'bold', color: '#276749' },
});