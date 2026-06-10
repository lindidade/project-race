import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import ApiService from '../services/ApiService';

export default function RegisterScreen({ onNavigateToLogin }: { 
    onNavigateToLogin: () => void 
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Fel', 'Vänligen fyll i alla fält.');
            return;
        }
        setLoading(true);
        try {
            await ApiService.register(name, email, password);
            Alert.alert('Klart!', 'Kontot är skapat, logga in nu!');
            onNavigateToLogin();
        } catch (error: any) {
            Alert.alert('Fel', error.message || 'Registreringen misslyckades.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Skapa konto 🏃</Text>
            <Text style={styles.subtitle}>Börja ditt race idag</Text>

            <TextInput style={styles.input} placeholder="Namn" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="E-postadress" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Lösenord" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrera</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={onNavigateToLogin} style={styles.linkButton}>
                <Text style={styles.linkText}>Har du redan ett konto? Logga in här</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F0F4F8' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1A202C', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#718096', marginBottom: 30, textAlign: 'center' },
    input: { height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#1A202C' },
    button: { backgroundColor: '#4CAF50', height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#2B6CB0', fontSize: 14, fontWeight: '500' },
});