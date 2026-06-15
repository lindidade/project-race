import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import ApiService from '../services/ApiService';

export default function DashboardScreen({ user, onLogout, onNavigateToFriends, onNavigateToLeaderboard, onNavigateToCompetition }: {
    user: any,
    onLogout: () => void,
    onNavigateToFriends: () => void,
    onNavigateToLeaderboard: () => void,
    onNavigateToCompetition: () => void
}) {
    const [distance, setDistance] = useState('');
    const [stats, setStats] = useState({ totalDistance: 0, activityCount: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const activities = await ApiService.getUserActivities(user.id);
            const totalDistance = activities.reduce((sum: number, a: any) => sum + parseFloat(a.distance), 0);
            setStats({ totalDistance, activityCount: activities.length });
        } catch (error) {
            Alert.alert('Error', 'Could not fetch activities.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddActivity = async () => {
        const parsedDistance = parseFloat(distance);
        if (isNaN(parsedDistance) || parsedDistance <= 0) {
            Alert.alert('Error', 'Please enter a valid distance in kilometers.');
            return;
        }
        setSubmitting(true);
        try {
            await ApiService.saveActivity(user.id, parsedDistance);
            Alert.alert('Great job! 🎉', `You have logged ${parsedDistance} km.`);
            setDistance('');
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not save activity.');
        } finally {
            setSubmitting(false);
        }
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
                    <View>
                        <Text style={styles.welcomeText}>Hello, {user.name}! </Text>
                        <Text style={styles.subtitle}>Here are your progress</Text>
                    </View>
                    <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Log out</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats cards */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: '#D4EDDA' }]}>
                        <Text style={styles.statEmoji}>🏃</Text>
                        <Text style={styles.statLabel}>Total distance</Text>
                        <Text style={[styles.statValue, { color: '#3A7D44' }]}>
                            {stats.totalDistance.toFixed(1)} km
                        </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFE5D9' }]}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={styles.statLabel}>Activity count</Text>
                        <Text style={[styles.statValue, { color: '#C4622D' }]}>
                            {stats.activityCount} sessions
                        </Text>
                    </View>
                </View>

                {/* Log run card */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Log a run 🏃‍♀️</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Distance in km (e.g., 5.5)"
                        placeholderTextColor="#A8B8A0"
                        keyboardType="numeric"
                        value={distance}
                        onChangeText={setDistance}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleAddActivity} disabled={submitting}>
                        {submitting
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.saveButtonText}>Save run</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Motivational text */}
                <Text style={styles.motivational}>Keep going — every step counts! 🌿</Text>

            </ScrollView>

           
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAF7' },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF7' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 20 },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#2D4A2D' },
    subtitle: { fontSize: 14, color: '#7A9E7A', marginTop: 2 },
    logoutBtn: { backgroundColor: '#FFE5D9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    logoutText: { color: '#C4622D', fontWeight: '600', fontSize: 13 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
    statCard: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    statEmoji: { fontSize: 28, marginBottom: 6 },
    statLabel: { fontSize: 12, color: '#5A7A5A', fontWeight: '500', marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: 'bold' },

    formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 20 },
    formTitle: { fontSize: 17, fontWeight: 'bold', color: '#2D4A2D', marginBottom: 14 },
    input: { height: 50, backgroundColor: '#F4F8F4', borderRadius: 12, paddingHorizontal: 15, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#D4E8D4', color: '#2D4A2D' },
    saveButton: { backgroundColor: '#7CB987', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    motivational: { textAlign: 'center', color: '#A8B8A0', fontSize: 14, fontStyle: 'italic', marginBottom: 10 },

    bottomNav: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#EEF2EE', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5 },
    navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    navIcon: { fontSize: 22, marginBottom: 3 },
    navIconActive: { fontSize: 22, marginBottom: 3 },
    navLabel: { fontSize: 11, color: '#A8B8A0' },
    navLabelActive: { color: '#7CB987', fontWeight: '600' },
});