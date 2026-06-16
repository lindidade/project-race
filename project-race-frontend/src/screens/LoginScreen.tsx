import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import ApiService from '../services/ApiService';
import { Colors } from '../constants/colors';

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
            <Text style={styles.title}>Start your journey</Text>
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
    container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: Colors.background },
    title: { fontSize: 32, fontWeight: 'bold', color: Colors.textDark, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: Colors.textMedium, marginBottom: 40, textAlign: 'center' },
    input: { height: 50, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: Colors.cardBorder, color: Colors.textDark },
    button: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    buttonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
});