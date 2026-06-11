import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import ApiService from '../services/ApiService';

export default function DashboardScreen({ user, onLogout, onNavigateToFriends }: { 
    user: any, 
    onLogout: () => void,
    onNavigateToFriends: () => void
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
            Alert.alert('Fel', 'Kunde inte hämta aktiviteter.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddActivity = async () => {
        const parsedDistance = parseFloat(distance);
        if (isNaN(parsedDistance) || parsedDistance <= 0) {
            Alert.alert('Fel', 'Vänligen fyll i en giltig distans i kilometer.');
            return;
        }
        setSubmitting(true);
        try {
            await ApiService.saveActivity(user.id, parsedDistance);
            Alert.alert('Snyggt jobbat! 🎉', `Du har registrerat ${parsedDistance} km.`);
            setDistance('');
            fetchData();
        } catch (error: any) {
            Alert.alert('Fel', error.message || 'Kunde inte spara aktivitet.');
        } finally {
            setSubmitting(false);
        }
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
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Hej, {user.name}! 👋</Text>
                <TouchableOpacity onPress={onLogout}>
                    <Text style={styles.logoutText}>Logga ut</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Här är dina framsteg</Text>

            <View style={styles.statsRow}>
                <View style={[styles.card, { backgroundColor: '#C6F6D5' }]}>
                    <Text style={styles.cardLabel}>Totalt sprungit</Text>
                    <Text style={[styles.cardValue, { color: '#276749' }]}>
                        {stats.totalDistance.toFixed(1)} km
                    </Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#BEE3F8' }]}>
                    <Text style={styles.cardLabel}>Antal rundor</Text>
                    <Text style={[styles.cardValue, { color: '#2A69AC' }]}>
                        {stats.activityCount} st
                    </Text>
                </View>
            </View>

            <View style={styles.formCard}>
    <Text style={styles.formTitle}>Log new run 🏃‍♂️</Text>
    <TextInput
        style={styles.input}
        placeholder="Distance in km (e.g. 5.5)"
        keyboardType="numeric"
        value={distance}
        onChangeText={setDistance}
    />
    <TouchableOpacity style={styles.button} onPress={handleAddActivity} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save run</Text>}
    </TouchableOpacity>
</View>

<TouchableOpacity style={styles.friendsButton} onPress={onNavigateToFriends}>
    <Text style={styles.friendsButtonText}>👥 My Friends</Text>
</TouchableOpacity>
            </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    welcomeText: { fontSize: 26, fontWeight: 'bold', color: '#1A202C' },
    logoutText: { color: '#E53E3E', fontWeight: '600' },
    subtitle: { fontSize: 16, color: '#718096', marginBottom: 25 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    card: { flex: 1, borderRadius: 12, padding: 20, marginHorizontal: 5 },
    cardLabel: { fontSize: 14, color: '#1A202C', fontWeight: '500', marginBottom: 5 },
    cardValue: { fontSize: 24, fontWeight: 'bold' },
    formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
    input: { height: 50, backgroundColor: '#F0F4F8', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#1A202C' },
    button: { backgroundColor: '#4CAF50', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    friendsButton: { backgroundColor: '#2B6CB0', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
    friendsButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});