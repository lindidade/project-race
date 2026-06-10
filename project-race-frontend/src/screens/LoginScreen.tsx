import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import ApiService from '../services/ApiService';

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: { 
    onLoginSuccess: (user: any) => void, 
    onNavigateToRegister: () => void 
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in both email and password.');
            return;
        }
        setLoading(true);
        try {
            const userData = await ApiService.login(email, password);
            onLoginSuccess(userData);
        } catch (error: any) {
            Alert.alert('Login failed', error.message || 'Wrong email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome back 👋</Text>
            <Text style={styles.subtitle}>Log in to continue your race</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                autoCapitalize="none"
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={onNavigateToRegister} style={styles.linkButton}>
                <Text style={styles.linkText}>No account? Register here</Text>
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