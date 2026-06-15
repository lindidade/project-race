import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import ApiService from '../services/ApiService';
import { Colors } from '../constants/colors';

export default function DashboardScreen({ user, onLogout }: { 
    user: any, 
    onLogout: () => void
}){


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
                    <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
                        <Text style={styles.statEmoji}>🏃</Text>
                        <Text style={styles.statLabel}>Total distance</Text>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>
                            {stats.totalDistance.toFixed(1)} km
                        </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: Colors.secondaryLight }]}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={styles.statLabel}>Activity count</Text>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>
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
    safeArea: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 20 },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: Colors.textDark },
    subtitle: { fontSize: 14, color: Colors.textMedium, marginTop: 2 },
    logoutBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    logoutText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
    statCard: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center' },
    statEmoji: { fontSize: 28, marginBottom: 6 },
    statLabel: { fontSize: 12, color: Colors.textMedium, fontWeight: '500', marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: 'bold' },

    formCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 20 },
    formTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textDark, marginBottom: 14 },
    input: { height: 50, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 15, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.textDark },
    saveButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },

    motivational: { textAlign: 'center', color: Colors.textLight, fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
});