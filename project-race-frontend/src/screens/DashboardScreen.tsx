import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, Platform } from 'react-native';
import ApiService from '../services/ApiService';
import { Colors } from '../constants/colors';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen({ user, onLogout }: {
    user: any,
    onLogout: () => void
}) {
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [distance, setDistance] = useState('');
    const [stats, setStats] = useState({ totalDistance: 0, activityCount: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [coachMessage, setCoachMessage] = useState('');
    const [coachLoading, setCoachLoading] = useState(false);

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

    useEffect(() => {
        fetchData();
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            }
        })();
    }, []);

    const handleGetMotivation = async () => {
        setCoachLoading(true);
        setCoachMessage('');
        try {
            const avgDistance = stats.activityCount > 0
                ? (stats.totalDistance / stats.activityCount).toFixed(2)
                : '0';

            const response = await fetch('http://localhost:5000/api/coach/analyse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activityCount: stats.activityCount,
                    totalDistance: stats.totalDistance,
                    avgDistance: parseFloat(avgDistance)
                })
            });

            const data = await response.json();
            const message = data.message ?? 'Keep pushing — you are doing great!';
            setCoachMessage(message);
        } catch (error) {
            setCoachMessage('Could not load motivation. Keep going anyway! 💪');
        } finally {
            setCoachLoading(false);
        }
    };

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
                        <Text style={styles.welcomeText}>Hello {user.name}! </Text>
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

                {/* Map */}
                <View style={styles.mapCard}>
                    <Text style={styles.formTitle}>Your area 🗺️</Text>
                    {Platform.OS === 'web' ? (
                        React.createElement('iframe', {
                            src: `https://www.openstreetmap.org/export/embed.html?bbox=${(location?.longitude ?? 13.0038) - 0.01}%2C${(location?.latitude ?? 55.6050) - 0.01}%2C${(location?.longitude ?? 13.0038) + 0.01}%2C${(location?.latitude ?? 55.6050) + 0.01}&layer=mapnik&marker=${location?.latitude ?? 55.6050}%2C${location?.longitude ?? 13.0038}&zoom_controls=false`,
                            width: '100%',
                            height: '200',
                            style: { border: 'none', borderRadius: 12 },
                            loading: 'lazy',
                        })
                    ) : (
                        <WebView
                            style={styles.map}
                            source={{ uri: `https://www.openstreetmap.org/export/embed.html?bbox=${(location?.longitude ?? 13.0038) - 0.01}%2C${(location?.latitude ?? 55.6050) - 0.01}%2C${(location?.longitude ?? 13.0038) + 0.01}%2C${(location?.latitude ?? 55.6050) + 0.01}&layer=mapnik&marker=${location?.latitude ?? 55.6050}%2C${location?.longitude ?? 13.0038}` }}
                        />
                    )}
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

                {/* AI Progress Analysis */}
                <View style={styles.coachCard}>
                    <Text style={styles.formTitle}>AI Progress Analysis</Text>
                    <Text style={styles.coachSubtitle}>Powered by Claude AI</Text>
                    <TouchableOpacity
                        onPress={handleGetMotivation}
                        disabled={coachLoading}
                        style={styles.coachButtonWrapper}
                    >
                        <LinearGradient
                            colors={['#4A90D9', '#7B5EA7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.coachButton}
                        >
                            {coachLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.coachButtonText}>Analyse my progress</Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                    {coachMessage !== '' && (
                        <Text style={styles.coachMessage}>{coachMessage}</Text>
                    )}
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

    coachCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, marginBottom: 20 },
    coachSubtitle: { fontSize: 12, color: Colors.textMedium, marginTop: -10, marginBottom: 16 },
    coachButtonWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    coachButton: { height: 50, alignItems: 'center', justifyContent: 'center' },
    coachButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    coachMessage: { fontSize: 15, color: Colors.textDark, lineHeight: 22, textAlign: 'center', marginTop: 4 },

    motivational: { textAlign: 'center', color: Colors.textLight, fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
    mapCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginBottom: 20 },
    map: { width: '100%', height: 200, borderRadius: 12 },
});