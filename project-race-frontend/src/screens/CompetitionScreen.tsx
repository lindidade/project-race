import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ApiService from '../services/ApiService';

export default function CompetitionScreen({ user }: { user: any}) {
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);

    const today = new Date();

    const fetchCompetitions = async () => {
        try {
            const data = await ApiService.getUserCompetitions(user.id);
            setCompetitions(data);
        } catch (error) {
            Alert.alert('Error', 'Could not load competitions.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (competitionId: number) => {
        try {
            const data = await ApiService.getCompetitionMembers(competitionId);
            setMembers(data);
        } catch (error) {
            Alert.alert('Error', 'Could not load members.');
        }
    };

    const fetchFriends = async () => {
        try {
            const data = await ApiService.getFriends(user.id);
            setFriends(data);
        } catch (error) {
            console.error('Could not load friends');
        }
    };

    const handleSelectCompetition = (competition: any) => {
        setSelectedCompetition(competition);
        fetchMembers(competition.id);
        fetchFriends();
    };

    const handleInvite = async (friendId: number) => {
        try {
            await ApiService.inviteToCompetition(selectedCompetition.id, friendId);
            Alert.alert('Success', 'Friend invited!');
            fetchMembers(selectedCompetition.id);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not invite friend.');
        }
    };

    const handleUpdateTier = async (memberId: number, tier: number) => {
        try {
            await ApiService.updateMemberTier(memberId, tier);
            fetchMembers(selectedCompetition.id);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not update tier.');
        }
    };

    useEffect(() => { fetchCompetitions(); }, []);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const handleCreate = async () => {
        if (!name || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setCreating(true);
        try {
            await ApiService.createCompetition(name, formatDate(startDate), formatDate(endDate), user.id);
            Alert.alert('Success', 'Competition created!');
            setName('');
            setStartDate(null);
            setEndDate(null);
            setShowForm(false);
            fetchCompetitions();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not create competition.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#7CB987" />
            </View>
        );
    }

    // Competition detail view
    if (selectedCompetition) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity onPress={() => setSelectedCompetition(null)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back to competitions</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>{selectedCompetition.name}</Text>
                    <Text style={styles.dateText}>
                        {selectedCompetition.startDate} → {selectedCompetition.endDate}
                    </Text>

                    {/* Members */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                        {members.map((m: any) => (
                            <View key={m.id} style={styles.memberRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{m.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{m.name}</Text>
                                    <Text style={styles.memberRole}>{m.role}</Text>
                                </View>
                                <View style={styles.tierButtons}>
                                    {[1, 2, 3].map((tier) => (
                                        <TouchableOpacity
                                            key={tier}
                                            style={[styles.tierButton, m.tier === tier && styles.tierButtonActive]}
                                            onPress={() => handleUpdateTier(m.id, tier)}
                                        >
                                            <Text style={[styles.tierButtonText, m.tier === tier && styles.tierButtonTextActive]}>
                                                T{tier}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Invite Friends */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Invite Friends</Text>
                        {friends.filter((f: any) => f.status === 'accepted').length === 0 ? (
                            <Text style={styles.emptyText}>No accepted friends to invite.</Text>
                        ) : (
                            friends.filter((f: any) => f.status === 'accepted').map((f: any) => (
                                <View key={f.id} style={styles.memberRow}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{f.friendName?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.memberName}>{f.friendName}</Text>
                                    <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvite(f.friendId)}>
                                        <Text style={styles.inviteButtonText}>Invite</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Competition list view
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>                   
                    <Text style={styles.title}>Competitions</Text>
                </View>

                {/* Create button */}
                <TouchableOpacity style={styles.createButton} onPress={() => setShowForm(!showForm)}>
                    <Text style={styles.createButtonText}>+ Create Competition</Text>
                </TouchableOpacity>

                {/* Create form */}
                {showForm && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>New Competition</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Competition name"
                            placeholderTextColor="#A8B8A0"
                            value={name}
                            onChangeText={setName}
                        />

                        {Platform.OS === 'web' ? (
                            React.createElement('input', {
                                type: 'date',
                                min: formatDate(today),
                                value: startDate ? formatDate(startDate) : '',
                                onChange: (e: any) => setStartDate(new Date(e.target.value)),
                                style: { height: 50, backgroundColor: '#F4F8F4', borderRadius: 12, paddingLeft: 15, marginBottom: 15, fontSize: 16, border: '1px solid #D4E8D4', width: '100%', boxSizing: 'border-box', color: '#2D4A2D' }
                            })
                        ) : (
                            <>
                                <TouchableOpacity style={styles.datePicker} onPress={() => setShowStartPicker(true)}>
                                    <Text style={styles.datePickerText}>
                                        {startDate ? `Start: ${formatDate(startDate)}` : 'Select start date'}
                                    </Text>
                                </TouchableOpacity>
                                <DateTimePickerModal
                                    isVisible={showStartPicker}
                                    mode="date"
                                    minimumDate={today}
                                    onConfirm={(date) => { setStartDate(date); setShowStartPicker(false); }}
                                    onCancel={() => setShowStartPicker(false)}
                                />
                            </>
                        )}

                        {Platform.OS === 'web' ? (
                            React.createElement('input', {
                                type: 'date',
                                min: startDate ? formatDate(startDate) : formatDate(today),
                                value: endDate ? formatDate(endDate) : '',
                                onChange: (e: any) => setEndDate(new Date(e.target.value)),
                                style: { height: 50, backgroundColor: '#F4F8F4', borderRadius: 12, paddingLeft: 15, marginBottom: 15, fontSize: 16, border: '1px solid #D4E8D4', width: '100%', boxSizing: 'border-box', color: '#2D4A2D' }
                            })
                        ) : (
                            <>
                                <TouchableOpacity style={styles.datePicker} onPress={() => setShowEndPicker(true)}>
                                    <Text style={styles.datePickerText}>
                                        {endDate ? `End: ${formatDate(endDate)}` : 'Select end date'}
                                    </Text>
                                </TouchableOpacity>
                                <DateTimePickerModal
                                    isVisible={showEndPicker}
                                    mode="date"
                                    minimumDate={startDate || today}
                                    onConfirm={(date) => { setEndDate(date); setShowEndPicker(false); }}
                                    onCancel={() => setShowEndPicker(false)}
                                />
                            </>
                        )}

                        <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={creating}>
                            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Competition list */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>My Competitions ({competitions.length})</Text>
                    {competitions.length === 0 ? (
                        <Text style={styles.emptyText}>No competitions yet. Create one above! 🌿</Text>
                    ) : (
                        competitions.map((c: any) => (
                            <TouchableOpacity key={c.id} style={styles.competitionRow} onPress={() => handleSelectCompetition(c)}>
                                <View style={styles.competitionIcon}>
                                    <Text style={{ fontSize: 20 }}>🏁</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.competitionName}>{c.name}</Text>
                                    <Text style={styles.dateText}>{c.startDate} → {c.endDate}</Text>
                                </View>
                                <Text style={{ color: '#A8B8A0', fontSize: 18 }}>›</Text>
                            </TouchableOpacity>
                        ))
                    )}
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
    dateText: { fontSize: 13, color: '#7A9E7A', marginTop: 4, marginBottom: 16 },

    createButton: { backgroundColor: '#7CB987', height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D4A2D', marginBottom: 14 },

    input: { height: 50, backgroundColor: '#F4F8F4', borderRadius: 12, paddingHorizontal: 15, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#D4E8D4', color: '#2D4A2D' },
    datePicker: { height: 50, backgroundColor: '#F4F8F4', borderRadius: 12, paddingHorizontal: 15, marginBottom: 14, borderWidth: 1, borderColor: '#D4E8D4', justifyContent: 'center' },
    datePickerText: { fontSize: 16, color: '#2D4A2D' },
    submitButton: { backgroundColor: '#7CB987', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    competitionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F0', gap: 12 },
    competitionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE5D9', alignItems: 'center', justifyContent: 'center' },
    competitionName: { fontSize: 15, fontWeight: '600', color: '#2D4A2D' },

    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F0' },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4EDDA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: '#3A7D44', fontWeight: 'bold', fontSize: 15 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, color: '#2D4A2D', fontWeight: '500' },
    memberRole: { fontSize: 12, color: '#7A9E7A' },

    tierButtons: { flexDirection: 'row', gap: 5 },
    tierButton: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: '#D4E8D4', alignItems: 'center', justifyContent: 'center' },
    tierButtonActive: { backgroundColor: '#7CB987', borderColor: '#7CB987' },
    tierButtonText: { fontSize: 12, color: '#7A9E7A', fontWeight: 'bold' },
    tierButtonTextActive: { color: '#fff' },

    inviteButton: { backgroundColor: '#F4A261', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    inviteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    emptyText: { color: '#A8B8A0', textAlign: 'center', paddingVertical: 20, fontSize: 14 },
});