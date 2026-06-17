import AsyncStorage from '@react-native-async-storage/async-storage';

//const API_URL = 'http://192.168.1.123:5000/api';
const API_URL = 'http://localhost:5000/api';

const ApiService = {
    register: async (name: string, email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (e) {
                data = { message: textData };
            }
            if (!response.ok) throw new Error(data.message || 'Registration failed');
            return data;
        } catch (error: any) {
            console.error('API Register Error:', error.message);
            throw error;
        }
    },

    login: async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch (e) {
                data = { message: textData };
            }
            if (!response.ok) throw new Error(data.message || 'Login failed');
            if (data.token) {
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));
            }
            return data;
        } catch (error: any) {
            console.error('API Login Error:', error.message);
            throw error;
        }
    },

    getToken: async () => {
        return await AsyncStorage.getItem('userToken');
    },

    getUserData: async () => {
        const data = await AsyncStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    },

    logout: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
    },

    saveActivity: async (userId: number, distance: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, distance })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Kunde inte spara aktivitet');
            return data;
        } catch (error: any) {
            console.error('API SaveActivity Error:', error.message);
            throw error;
        }
    },

    getUserActivities: async (userId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/activities/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Kunde inte hämta aktiviteter');
            return data;
        } catch (error: any) {
            console.error('API GetUserActivities Error:', error.message);
            throw error;
        }
    },
    getFriends: async (userId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/friends/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load friends');
            return data;
        } catch (error: any) {
            console.error('API GetFriends Error:', error.message);
            throw error;
        }
    },

    sendFriendRequest: async (userId1: number, userId2: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId1, userId2 })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not send request');
            return data;
        } catch (error: any) {
            console.error('API SendFriendRequest Error:', error.message);
            throw error;
        }
    },

    searchUsers: async (email: string) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/users/search?email=${email}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not search users');
            return data;
        } catch (error: any) {
            console.error('API SearchUsers Error:', error.message);
            throw error;
        }
    },
    getPendingRequests: async (userId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/friends/pending/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load requests');
            return data;
        } catch (error: any) {
            console.error('API GetPendingRequests Error:', error.message);
            throw error;
        }
    },

    acceptFriendRequest: async (friendId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/friends/accept/${friendId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not accept request');
            return data;
        } catch (error: any) {
            console.error('API AcceptFriendRequest Error:', error.message);
            throw error;
        }
    },

    getLeaderboard: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/leaderboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load leaderboard');
            return data;
        } catch (error: any) {
            console.error('API GetLeaderboard Error:', error.message);
            throw error;
        }
    },

    createCompetition: async (name: string, startDate: string, endDate: string, createdBy: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, startDate, endDate, createdBy })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not create competition');
            return data;
        } catch (error: any) {
            console.error('API CreateCompetition Error:', error.message);
            throw error;
        }
    },

    getUserCompetitions: async (userId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load competitions');
            return data;
        } catch (error: any) {
            console.error('API GetUserCompetitions Error:', error.message);
            throw error;
        }
    },
    inviteToCompetition: async (competitionId: number, userId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ competitionId, userId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not invite user');
            return data;
        } catch (error: any) {
            console.error('API InviteToCompetition Error:', error.message);
            throw error;
        }
    },

    getCompetitionMembers: async (competitionId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/${competitionId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load members');
            return data;
        } catch (error: any) {
            console.error('API GetCompetitionMembers Error:', error.message);
            throw error;
        }
    },

    updateMemberTier: async (memberId: number, tier: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/members/${memberId}/tier`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tier })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not update tier');
            return data;
        } catch (error: any) {
            console.error('API UpdateMemberTier Error:', error.message);
            throw error;
        }
    },

    randomizeTeams: async (competitionId: number, numberOfTeams: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/${competitionId}/randomize-teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ numberOfTeams })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not randomize teams');
            return data;
        } catch (error: any) {
            console.error('API RandomizeTeams Error:', error.message);
            throw error;
        }
    },

    getTeams: async (competitionId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/${competitionId}/teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load teams');
            return data;
        } catch (error: any) {
            console.error('API GetTeams Error:', error.message);
            throw error;
        }
    },

    getUserById: async (userId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not load user');
            return data;
        } catch (error: any) {
            console.error('API GetUserById Error:', error.message);
            throw error;
        }
    },

    updateMemberRole: async (memberId: number, role: string) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/members/${memberId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not update role');
            return data;
        } catch (error: any) {
            console.error('API UpdateMemberRole Error:', error.message);
            throw error;
        }
    },

    startCompetition: async (competitionId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/${competitionId}/start`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not start competition');
            return data;
        } catch (error: any) {
            console.error('API StartCompetition Error:', error.message);
            throw error;
        }
    },

    endCompetition: async (competitionId: number) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/competitions/${competitionId}/end`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Could not end competition');
            return data;
        } catch (error: any) {
            console.error('API EndCompetition Error:', error.message);
            throw error;
        }
    },

};

export default ApiService;