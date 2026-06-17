import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import CompetitionScreen from './src/screens/CompetitionScreen';
import BottomNav from './src/components/BottomNav';
import ProfileScreen from './src/screens/ProfileScreen';

type Screen = 'login' | 'register' | 'dashboard' | 'friends' | 'leaderboard' | 'competition' | 'profile';

export default function App() {
    const [screen, setScreen] = useState<Screen>('login');
    const [user, setUser] = useState<any>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);
    const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [competitionKey, setCompetitionKey] = useState(0);

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
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4A6741" />
            </View>
        );
    }

    // No bottom nav for login/register
    if (screen === 'register') {
        return <RegisterScreen onNavigateToLogin={() => setScreen('login')} />;
    }

    if (screen === 'login' || !user) {
        return (
            <LoginScreen
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={() => setScreen('register')}
            />
        );
    }

    // All main screens share bottom nav
    const renderScreen = () => {
        switch (screen) {
            case 'dashboard':
                return <DashboardScreen user={user} onLogout={handleLogout} />;
            case 'friends':
                return <FriendsScreen user={user} onNavigateToProfile={(userId) => { setSelectedUserId(userId); setSelectedCompetitionId(null); setScreen('profile'); }} />;
            case 'leaderboard':
                return <LeaderboardScreen user={user} />;
            case 'competition':
                return <CompetitionScreen
                key={competitionKey}
                    user={user}
                    onNavigateToProfile={(userId, currentUserId, competitionId) => {
                        setSelectedUserId(userId);
                        setSelectedCompetitionId(competitionId);
                        setScreen('profile');
                    }}
                    initialCompetition={null}
                    onCompetitionSelected={(c) => setSelectedCompetition(c)}
                />;
            case 'profile':
                return <ProfileScreen
                    userId={selectedUserId!}
                    currentUser={user}
                    competitionId={selectedCompetitionId!}
                    onBack={() => setScreen('competition')}
                />;
            default:
                return <DashboardScreen user={user} onLogout={handleLogout} />;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {renderScreen()}
            </View>
            {screen !== 'profile' && (
                <BottomNav
                    activeScreen={screen as any}
                    onNavigate={(s) => {
                        if (s === 'competition') setCompetitionKey(k => k + 1);
                        setScreen(s);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9F2' },
    content: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});