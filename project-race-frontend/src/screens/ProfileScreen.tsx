import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import ApiService from '../services/ApiService';


export default function ProfileScreen({ userId, currentUser, competitionId, onBack }: {
    userId: number,
    currentUser: any,
    competitionId: number,
    onBack: () => void
}) {
    const [profile, setProfile] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const promises: any[] = [
                ApiService.getUserActivities(userId),
                ApiService.getUserCompetitions(userId),
                ApiService.getUserById(userId),
            ];

            if (competitionId) {
                promises.push(ApiService.getCompetitionMembers(competitionId));
            }

            const results = await Promise.all(promises);
            setActivities(results[0]);
            setCompetitions(results[1]);
            setProfile(results[2]);

            if (competitionId && results[3]) {
                const currentMember = results[3].find((m: any) => m.userId === currentUser.id);
                setIsMainAdmin(currentMember?.role === 'super_admin');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not load profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);



    const [isMainAdmin, setIsMainAdmin] = useState(false);

    const handleMakeAdmin = async () => {
        try {
            const membersData = await ApiService.getCompetitionMembers(competitionId);
            const targetMember = membersData.find((m: any) => m.userId === userId);
            if (!targetMember) {
                Alert.alert('Error', 'Could not find member.');
                return;
            }
            await ApiService.updateMemberRole(targetMember.id, 'co_admin');
            Alert.alert('Success', `${profile?.name} is now an Administrator!`);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not update role.');
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }



    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                {/* Profile card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>
                            {profile?.name?.charAt(0).toUpperCase() ?? userId.toString()}
                        </Text>
                    </View>
                    <Text style={styles.profileName}>{profile?.name ?? 'User ' + userId}</Text>                  
                </View>

                {/* Stats */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Activity Summary</Text>
                    <Text style={styles.statText}>
                        Total distance: <Text style={styles.statValue}>
                            {activities.reduce((sum: number, a: any) => sum + parseFloat(a.distance), 0).toFixed(1)} km
                        </Text>
                    </Text>
                    <Text style={styles.statText}>
                        Total sessions: <Text style={styles.statValue}>{activities.length}</Text>
                    </Text>
                </View>

                {/* Competitions */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Competitions ({competitions.length})</Text>
                    {competitions.length === 0 ? (
                        <Text style={styles.emptyText}>No competitions yet.</Text>
                    ) : (
                        competitions.map((c: any) => (
                            <View key={c.id} style={styles.competitionRow}>
                                <Text style={styles.competitionName}>{c.name}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Make Administrator button */}
                {isMainAdmin && (
                    <TouchableOpacity style={styles.adminButton} onPress={handleMakeAdmin}>
                        <Text style={styles.adminButtonText}>⭐ Make Administrator</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    backButton: { marginBottom: 16 },
    backButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },

    profileCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarLargeText: { fontSize: 32, fontWeight: 'bold', color: Colors.primary },
    profileName: { fontSize: 22, fontWeight: 'bold', color: Colors.textDark, marginBottom: 4 },
    profileRole: { fontSize: 14, color: Colors.textMedium, backgroundColor: Colors.secondaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

    card: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textDark, marginBottom: 12 },
    statText: { fontSize: 14, color: Colors.textMedium, marginBottom: 6 },
    statValue: { color: Colors.primary, fontWeight: 'bold' },

    competitionRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
    competitionName: { fontSize: 14, color: Colors.textDark },

    adminButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    adminButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },

    emptyText: { color: Colors.textLight, textAlign: 'center', paddingVertical: 10 },
});