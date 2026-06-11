import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import ApiService from '../services/ApiService';

export default function CompetitionScreen({ user, onBack }: { user: any, onBack: () => void }) {
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    useEffect(() => { fetchCompetitions(); }, []);

    const handleCreate = async () => {
        if (!name || !startDate || !endDate) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setCreating(true);
        try {
            await ApiService.createCompetition(name, startDate, endDate, user.id);
            Alert.alert('Success', 'Competition created!');
            setName('');
            setStartDate('');
            setEndDate('');
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
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🏁 Competitions</Text>

            <TouchableOpacity style={styles.createButton} onPress={() => setShowForm(!showForm)}>
                <Text style={styles.createButtonText}>+ Create Competition</Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.form}>
                    <Text style={styles.formTitle}>New Competition</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Competition name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Start date (YYYY-MM-DD)"
                        value={startDate}
                        onChangeText={setStartDate}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="End date (YYYY-MM-DD)"
                        value={endDate}
                        onChangeText={setEndDate}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={creating}>
                        {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create</Text>}
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Competitions ({competitions.length})</Text>
                {competitions.length === 0 ? (
                    <Text style={styles.emptyText}>No competitions yet. Create one above!</Text>
                ) : (
                    competitions.map((c: any) => (
                        <View key={c.id} style={styles.competitionRow}>
                            <Text style={styles.competitionName}>{c.name}</Text>
                            <Text style={styles.competitionDate}>{c.startDate} → {c.endDate}</Text>
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
    backButton: { marginBottom: 15 },
    backButtonText: { color: '#2B6CB0', fontSize: 16, fontWeight: '600' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 20 },
    createButton: { backgroundColor: '#4CAF50', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    form: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
    input: { height: 50, backgroundColor: '#F0F4F8', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#1A202C' },
    submitButton: { backgroundColor: '#4CAF50', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 10 },
    competitionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    competitionName: { fontSize: 16, fontWeight: '600', color: '#1A202C' },
    competitionDate: { fontSize: 14, color: '#718096', marginTop: 4 },
    emptyText: { color: '#718096', textAlign: 'center', paddingVertical: 20 },
});