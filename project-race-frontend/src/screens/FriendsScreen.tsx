import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, FlatList } from 'react-native';
import ApiService from '../services/ApiService';

export default function FriendsScreen({ user }: { user: any }) {
    const [friends, setFriends] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

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

    useEffect(() => { fetchFriends(); }, []);

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
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Friends</Text>

            {/* Search for users */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by email..."
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Search results */}
            {users.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Search Results</Text>
                    {users.map((u: any) => (
                        <View key={u.id} style={styles.userRow}>
                            <Text style={styles.userName}>{u.name}</Text>
                            <TouchableOpacity style={styles.addButton} onPress={() => handleSendRequest(u.id)}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Friends list */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Friends ({friends.length})</Text>
                {friends.length === 0 ? (
                    <Text style={styles.emptyText}>No friends yet. Search for users above!</Text>
                ) : (
                    friends.map((f: any) => (
                        <View key={f.id} style={styles.friendRow}>
                            <Text style={styles.userName}>Friend ID: {f.friendId}</Text>
                            <Text style={styles.status}>{f.status}</Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 20 },
    searchRow: { flexDirection: 'row', marginBottom: 20 },
    searchInput: { flex: 1, height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10 },
    searchButton: { backgroundColor: '#4CAF50', height: 50, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
    searchButtonText: { color: '#fff', fontWeight: 'bold' },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 10 },
    userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    friendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    userName: { fontSize: 16, color: '#1A202C' },
    status: { fontSize: 14, color: '#718096' },
    addButton: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { color: '#718096', textAlign: 'center', paddingVertical: 20 },
});