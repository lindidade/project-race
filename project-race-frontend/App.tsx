import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FriendsScreen from './src/screens/FriendsScreen';

type Screen = 'login' | 'register' | 'dashboard' | 'friends';

export default function App() {
    const [screen, setScreen] = useState<Screen>('login');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const userData = await AsyncStorage.getItem('userData');
                if (token && userData) {
                    setUser(JSON.parse(userData));
                    setScreen('dashboard');
                }
            } catch (e) {
                console.log('No saved session');
            } finally {
                setLoading(false);
            }
        };
        checkLogin();
    }, []);

    const handleLoginSuccess = (data: any) => {
        setUser(data.user);
        setScreen('dashboard');
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        setUser(null);
        setScreen('login');
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (screen === 'register') {
        return <RegisterScreen onNavigateToLogin={() => setScreen('login')} />;
    }

    if (screen === 'dashboard' && user) {
        return <DashboardScreen user={user} onLogout={handleLogout} onNavigateToFriends={() => setScreen('friends')} />;
    }

    if (screen === 'friends' && user) {
        return <FriendsScreen user={user} onBack={() => setScreen('dashboard')} />;
    }

    return (
        <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setScreen('register')}
        />
    );
}