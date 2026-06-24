import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ApiService from '../services/ApiService';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function CompetitionScreen({ user, onNavigateToProfile, initialCompetition, onCompetitionSelected }: {
    user: any,
    onNavigateToProfile: (userId: number, currentUserId: number, competitionId: number) => void,
    initialCompetition?: any,
    onCompetitionSelected?: (competition: any) => void
}) {
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [numberOfTeams, setNumberOfTeams] = useState(2);
    const [friends, setFriends] = useState<any[]>([]);
    const [invitedFriends, setInvitedFriends] = useState<number[]>([]);
    const [view, setView] = useState<'list' | 'create' | 'waiting' | 'teams' | 'active'>('list');

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

    const fetchTeams = async (competitionId: number) => {
        try {
            const data = await ApiService.getTeams(competitionId);
            setTeams(data);
        } catch (error) {
            console.error('Could not load teams');
        }
    };

    const handleRandomizeTeams = async () => {
        try {
            const data = await ApiService.randomizeTeams(selectedCompetition.id, numberOfTeams);
            setTeams(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not randomize teams.');
        }
    };

    const handleSelectCompetition = async (competition: any) => {
        console.log('Competition status:', competition.status);
        setSelectedCompetition(competition);
        await fetchMembers(competition.id);
        await fetchTeams(competition.id);
        fetchFriends();
        if (onCompetitionSelected) onCompetitionSelected(competition);

        await fetchTeams(competition.id);
        if (competition.status === 'active' || competition.status === 'completed') {
            setView('active');
        } else {
            setView('waiting');
        }
    };

    const handleInviteInCreate = (friendId: number) => {
        setInvitedFriends(prev => [...prev, friendId]);
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

    useEffect(() => {
        fetchCompetitions();
        if (initialCompetition) {
            handleSelectCompetition(initialCompetition);
        }
    }, []);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const handleCreate = async () => {
        if (!name || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setCreating(true);
        try {
            const result = await ApiService.createCompetition(name, formatDate(startDate), formatDate(endDate), user.id);
            // Invite selected friends
            for (const friendId of invitedFriends) {
                await ApiService.inviteToCompetition(result.competitionId, friendId);
            }
            Alert.alert('Success', 'Competition created!');
            setName('');
            setStartDate(null);
            setEndDate(null);
            setInvitedFriends([]);
            setSelectedCompetition({ id: result.competitionId, name, startDate: formatDate(startDate!), endDate: formatDate(endDate!) });
            fetchMembers(result.competitionId);
            fetchTeams(result.competitionId);
            fetchCompetitions();
            setView('waiting');
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

    // CREATE VIEW
    if (view === 'create') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity onPress={() => setView('list')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>New Competition</Text>

                    <View style={styles.card}>
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
                                    <Text style={styles.datePickerText}>{startDate ? `Start: ${formatDate(startDate)}` : 'Select start date'}</Text>
                                </TouchableOpacity>
                                <DateTimePickerModal isVisible={showStartPicker} mode="date" minimumDate={today}
                                    onConfirm={(date) => { setStartDate(date); setShowStartPicker(false); }}
                                    onCancel={() => setShowStartPicker(false)} />
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
                                    <Text style={styles.datePickerText}>{endDate ? `End: ${formatDate(endDate)}` : 'Select end date'}</Text>
                                </TouchableOpacity>
                                <DateTimePickerModal isVisible={showEndPicker} mode="date" minimumDate={startDate || today}
                                    onConfirm={(date) => { setEndDate(date); setShowEndPicker(false); }}
                                    onCancel={() => setShowEndPicker(false)} />
                            </>
                        )}
                    </View>

                    {/* Invite friends */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Invite Friends</Text>
                        {friends.filter((f: any) => f.status === 'accepted').map((f: any) => (
                            <View key={f.id} style={styles.memberRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{f.friendName?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{f.friendName}</Text>
                                </View>
                                <TouchableOpacity
                                    style={invitedFriends.includes(f.friendId) ? styles.pendingBadge : styles.inviteButton}
                                    onPress={() => {
                                        if (invitedFriends.includes(f.friendId)) {
                                            setInvitedFriends(prev => prev.filter(id => id !== f.friendId));
                                        } else {
                                            handleInviteInCreate(f.friendId);
                                        }
                                    }}>
                                    <Text style={invitedFriends.includes(f.friendId) ? styles.pendingText : styles.inviteButtonText}>
                                        {invitedFriends.includes(f.friendId) ? 'Added' : 'Invite'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={creating}>
                        {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Competition</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        );
    }

    // WAITING VIEW
    if (view === 'waiting') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <TouchableOpacity onPress={() => setView('list')} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back to competitions</Text>
                        </TouchableOpacity>
                        {members.some((m: any) => m.userId === user.id && m.role === 'super_admin') && (
                            <TouchableOpacity style={{ padding: 8 }} onPress={async () => {
                                if (window.confirm('Are you sure you want to delete this competition?')) {
                                    try {
                                        await ApiService.deleteCompetition(selectedCompetition.id, user.id);
                                        fetchCompetitions();
                                        setView('list');
                                    } catch (error: any) {
                                        alert(error.message);
                                    }
                                }
                            }}>
                                <Ionicons name="trash-outline" size={24} color="#E53935" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.title}>{selectedCompetition.name}</Text>
                    <Text style={styles.dateText}>{selectedCompetition.startDate} → {selectedCompetition.endDate}</Text>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Participants ({members.length})</Text>
                        {members.map((m: any) => (
                            <View key={m.id} style={styles.memberRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{m.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <TouchableOpacity style={styles.memberInfo} onPress={() => onNavigateToProfile(m.userId, user.id, selectedCompetition.id)}>
                                    <Text style={styles.memberName}>{m.name}</Text>
                                    <Text style={styles.memberRole}>{m.role}</Text>
                                </TouchableOpacity>
                                <View style={styles.tierButtons}>
                                    {[1, 2, 3].map((tier) => (
                                        <TouchableOpacity key={tier}
                                            style={[styles.tierButton, m.tier === tier && styles.tierButtonActive]}
                                            onPress={() => handleUpdateTier(m.id, tier)}>
                                            <Text style={[styles.tierButtonText, m.tier === tier && styles.tierButtonTextActive]}>T{tier}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Choose number of teams</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                            {[2, 3, 4].map(n => (
                                <TouchableOpacity key={n}
                                    style={[styles.tierButton, numberOfTeams === n && styles.tierButtonActive]}
                                    onPress={() => setNumberOfTeams(n)}>
                                    <Text style={[styles.tierButtonText, numberOfTeams === n && styles.tierButtonTextActive]}>{n}</Text>
                                </TouchableOpacity>
                            ))}
                            <Text style={{ color: Colors.textMedium, alignSelf: 'center', marginLeft: 4 }}>teams</Text>
                        </View>
                        <TouchableOpacity style={styles.submitButton} onPress={async () => { await handleRandomizeTeams(); setView('teams'); }}>
                            <Text style={styles.submitButtonText}>Randomize Teams</Text>
                        </TouchableOpacity>
                    </View>

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
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{f.friendName}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvite(f.friendId)}>
                                        <Text style={styles.inviteButtonText}>Invite</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView >
        );
    }


    // TEAMS VIEW
    if (view === 'teams') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity onPress={() => setView('waiting')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                        <Text style={styles.title}>{selectedCompetition?.name}</Text>
                        {members.some((m: any) => m.userId === user.id && m.role === 'super_admin') && (
                            <TouchableOpacity style={{ padding: 8 }} onPress={async () => {
                                if (window.confirm('Are you sure you want to delete this competition?')) {
                                    try {
                                        await ApiService.deleteCompetition(selectedCompetition.id, user.id);
                                        fetchCompetitions();
                                        setView('list');
                                    } catch (error: any) {
                                        alert(error.message);
                                    }
                                }
                            }}>
                                <Ionicons name="trash-outline" size={24} color="#E53935" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.dateText}>Team Results</Text>

                    {teams.length > 0 && (
                        <View style={{ gap: 12 }}>
                            {teams.map((team: any, index: number) => (
                                <View key={team.teamId} style={[styles.teamCard, index % 2 === 0 ? styles.teamCard1 : styles.teamCard2]}>
                                    <Text style={styles.teamCardTitle}>{team.teamName}</Text>
                                    <View style={styles.teamMembersRow}>
                                        {team.members.map((m: any) => (
                                            <View key={m.userId} style={styles.teamMemberBubble}>
                                                <View style={styles.teamAvatar}>
                                                    <Text style={styles.teamAvatarText}>{m.name?.charAt(0).toUpperCase()}</Text>
                                                </View>
                                                <Text style={styles.teamMemberName} numberOfLines={1}>{m.name?.split(' ')[0]}</Text>
                                                <View style={styles.teamTierBadge}>
                                                    <Text style={styles.teamTierText}>T{m.tier}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={[styles.submitButton, { marginTop: 20 }]} onPress={async () => { await handleRandomizeTeams(); }}>
                        <Text style={styles.submitButtonText}>Randomize Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, { marginTop: 12, backgroundColor: Colors.warning }]}
                        onPress={async () => {
                            try {
                                await ApiService.startCompetition(selectedCompetition.id);
                                Alert.alert('Competition started!', 'Good luck to all teams!');
                                setView('active');
                            } catch (error: any) {
                                Alert.alert('Error', error.message);
                            }
                        }}>
                        <Text style={styles.submitButtonText}>Start Competition</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }
    // ACTIVE VIEW
    if (view === 'active') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.title}>{selectedCompetition?.name}</Text>
                        {members.some((m: any) => m.userId === user.id && m.role === 'super_admin') && (
                            <TouchableOpacity style={{ padding: 8 }} onPress={async () => {
                                if (window.confirm('Are you sure you want to delete this competition?')) {
                                    try {
                                        await ApiService.deleteCompetition(selectedCompetition.id, user.id);
                                        fetchCompetitions();
                                        setView('list');
                                    } catch (error: any) {
                                        alert(error.message);
                                    }
                                }
                            }}>
                                <Ionicons name="trash-outline" size={24} color="#E53935" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                    <Text style={styles.dateText}>{selectedCompetition?.startDate} → {selectedCompetition?.endDate}</Text>

                    {teams.map((team: any, index: number) => (
                        <View key={team.teamId} style={[styles.card, { marginBottom: 16 }]}>
                            <Text style={styles.teamCardTitle}>{team.teamName}</Text>
                            {team.members.map((m: any) => (
                                <View key={m.userId} style={styles.memberRow}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{m.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{m.name}</Text>
                                    </View>
                                    <Text style={styles.memberKm}>{(m.totalKm ?? 0).toFixed(1)} km</Text>
                                </View>
                            ))}
                            <View style={styles.teamTotalRow}>
                                <Text style={styles.teamTotalText}>
                                    Team total: {team.members.reduce((sum: number, m: any) => sum + (m.totalKm ?? 0), 0).toFixed(1)} km
                                </Text>
                            </View>
                        </View>
                    ))}


                </ScrollView>
            </SafeAreaView>
        );
    }

    // LIST VIEW
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Competitions</Text>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={() => { fetchFriends(); setView('create'); }}>
                    <Text style={styles.createButtonText}>+ New Competition</Text>
                </TouchableOpacity>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>My Competitions ({competitions.length})</Text>
                    {competitions.length === 0 ? (
                        <Text style={styles.emptyText}>No competitions yet. Create one above!</Text>
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
    safeArea: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    header: { marginBottom: 20 },
    backButton: { marginBottom: 8 },
    backButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.textDark },
    dateText: { fontSize: 13, color: Colors.textMedium, marginTop: 4, marginBottom: 16 },
    createButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    createButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
    card: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textDark, marginBottom: 14 },
    input: { height: 50, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 15, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.textDark },
    datePicker: { height: 50, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 15, marginBottom: 14, borderWidth: 1, borderColor: Colors.cardBorder, justifyContent: 'center' },
    datePickerText: { fontSize: 16, color: Colors.textDark },
    submitButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
    competitionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder, gap: 12 },
    competitionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
    competitionName: { fontSize: 15, fontWeight: '600', color: Colors.textDark },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, color: Colors.textDark, fontWeight: '500' },
    memberRole: { fontSize: 12, color: Colors.textMedium },
    tierButtons: { flexDirection: 'row', gap: 5 },
    tierButton: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
    tierButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    tierButtonText: { fontSize: 12, color: Colors.textMedium, fontWeight: 'bold' },
    tierButtonTextActive: { color: Colors.white },
    inviteButton: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    inviteButtonText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
    pendingBadge: { backgroundColor: Colors.secondaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    pendingText: { color: Colors.textMedium, fontWeight: '600', fontSize: 13 },
    emptyText: { color: Colors.textLight, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
    teamCard: { borderRadius: 20, padding: 16, marginBottom: 4 },
    teamCard1: { backgroundColor: Colors.primaryLight },
    teamCard2: { backgroundColor: Colors.secondaryLight },
    teamCardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textDark, marginBottom: 12 },
    teamMembersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    teamMemberBubble: { alignItems: 'center', width: 64 },
    teamAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    teamAvatarText: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
    teamMemberName: { fontSize: 11, color: Colors.textDark, fontWeight: '500', textAlign: 'center' },
    teamTierBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
    teamTierText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
    activeBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
    activeBadgeText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
    memberKm: { fontSize: 14, fontWeight: 'bold', color: Colors.primary, marginLeft: 'auto' },
    teamTotalRow: { borderTopWidth: 1, borderTopColor: Colors.cardBorder, marginTop: 8, paddingTop: 8 },
    teamTotalText: { fontSize: 14, fontWeight: 'bold', color: Colors.textDark, textAlign: 'right' },
});