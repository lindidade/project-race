import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import ApiService from '../services/ApiService';
import { Colors } from '../constants/colors';

export default function RegisterScreen({ onNavigateToLogin }: { 
    onNavigateToLogin: () => void 
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await ApiService.register(name, email, password);
            Alert.alert('Success!', 'Account created successfully, please log in now!');
            onNavigateToLogin();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account 🏃</Text>
            <Text style={styles.subtitle}>Start your race today</Text>

            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={onNavigateToLogin} style={styles.linkButton}>
                <Text style={styles.linkText}>Already have an account? Log in here</Text>
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