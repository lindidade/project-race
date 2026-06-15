import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import ApiService from '../services/ApiService';
import { Colors } from '../constants/colors';

export default function FriendsScreen({ user }: { user: any}) {
    const [friends, setFriends] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    const fetchPendingRequests = async () => {
        try {
            const data = await ApiService.getPendingRequests(user.id);
            setPendingRequests(data);
        } catch (error) {
            console.error('Could not load pending requests');
        }
    };

    const fetchFriends = async () => {
        try {
            const data = await ApiService.getFriends(user.id);
            setFriends(data);
        } catch (error) {
            Alert.alert('Error', 'Could not load friends.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    const handleAccept = async (friendId: number) => {
        try {
            await ApiService.acceptFriendRequest(friendId);
            Alert.alert('Success', 'Friend request accepted!');
            fetchFriends();
            fetchPendingRequests();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleSendRequest = async (targetUserId: number) => {
        try {
            await ApiService.sendFriendRequest(user.id, targetUserId);
            Alert.alert('Success', 'Friend request sent!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not send request.');
        }
    };

    const handleSearch = async () => {
        try {
            const data = await ApiService.searchUsers(search);
            setUsers(data);
        } catch (error) {
            Alert.alert('Error', 'Could not search users.');
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
                    <Text style={styles.title}>Friends</Text>
                </View>

                {/* Search */}
                <View style={styles.searchCard}>
                    <Text style={styles.sectionTitle}>Find a friend</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by email..."
                            placeholderTextColor="#A8B8A0"
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                            <Text style={styles.searchButtonText}>Search</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search results */}
                    {users.length > 0 && users.map((u: any) => (
                        <View key={u.id} style={styles.userRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{u.name?.charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.userName}>{u.name}</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => handleSendRequest(u.id)}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Pending requests */}
                {pendingRequests.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Pending Requests 🔔</Text>
                        {pendingRequests.map((r: any) => (
                            <View key={r.id} style={styles.userRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{r.senderName?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.userName}>{r.senderName}</Text>
                                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(r.id)}>
                                    <Text style={styles.addButtonText}>Accept</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Friends list */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>My Friends ({friends.length})</Text>
                    {friends.length === 0 ? (
                        <Text style={styles.emptyText}>No friends yet. Search for users above! 🌿</Text>
                    ) : (
                        friends.map((f: any) => (
                            <View key={f.id} style={styles.friendRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{f.friendName?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.userName}>{f.friendName}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{f.status}</Text>
                                </View>
                            </View>
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
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.textDark },

    searchCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginBottom: 16 },
    card: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textDark, marginBottom: 12 },

    searchRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    searchInput: { flex: 1, height: 46, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.textDark },
    searchButton: { backgroundColor: Colors.primary, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center' },
    searchButtonText: { color: Colors.white, fontWeight: 'bold' },

    userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
    friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },

    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },

    userName: { flex: 1, fontSize: 15, color: Colors.textDark, fontWeight: '500' },

    addButton: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    acceptButton: { backgroundColor: Colors.warning, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    addButtonText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },

    statusBadge: { backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { color: Colors.textMedium, fontSize: 12, fontWeight: '500' },

    emptyText: { color: Colors.textLight, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
});