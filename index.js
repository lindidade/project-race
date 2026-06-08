const { auth, authorize } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt'); // Importera bcrypt för kryptering
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Project Race API rullar helt perfekt!');
});

// === NY ROUTE: Registrera en användare ===
app.post('/api/register', async (req, res) => {
    const { name, email, password, role, tier } = req.body;

    try {
        // 1. Kontrollera om användaren redan finns
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'E-postadressen är redan registrerad.' });
        }

        // 2. Hasha (kryptera) lösenordet
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Spara den nya användaren i databasen
        const newUser = await db.query(
            `INSERT INTO users (name, email, password_hash, role, tier) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, role, tier`,
            [name, email, passwordHash, role || 'participant', tier || null]
        );

        // 4. Skicka tillbaka den skapade användaren (men utan lösenordet!)
        res.status(201).json({
            message: 'Användaren har registrerats!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel vid registrering.' });
    }
});

// === NY ROUTE: Logga in en användare ===
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Sök efter användaren i databasen via e-post
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Fel e-postadress eller lösenord.' });
        }

        const user = result.rows[0];

        // 2. Jämför det inskickade lösenordet med det hashade i databasen
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ error: 'Fel e-postadress eller lösenord.' });
        }

        // 3. Om lösenordet matchar, skapa en JWT-token med användarens ID och roll
        const token = jwt.sign(
            { id: user.id, role: user.role, tier: user.tier },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // 4. Skicka tillbaka token och lite användarinfo till appen
        res.json({
            message: 'Inloggningen lyckades!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tier: user.tier
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel vid inloggning.' });
    }
});
// === NY ROUTE: Skapa en tävling (Användaren blir automatiskt Huvudadministratör) ===
app.post('/api/competitions', auth, async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id; // Hämtas automatiskt från JWT-token (den inloggade användaren)

    if (!name) {
        return res.status(400).json({ error: 'Tävlingens namn krävs.' });
    }

    try {
        // Skapa tävlingen och spara vem som skapade den
        const newCompetition = await db.query(
            'INSERT INTO competitions (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, userId]
        );

        res.status(201).json({
            message: 'Tävlingen har skapats! Du är nu Huvudadministratör för denna tävling.',
            competition: newCompetition.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när tävlingen skulle skapas.' });
    }
});

// === NY ROUTE: Skicka vänförfrågan ===
app.post('/api/friends/request', auth, async (req, res) => {
    const { friend_id } = req.body;
    const myId = req.user.id; // Din id från JWT-token

    if (!friend_id) {
        return res.status(400).json({ error: 'Mottagarens ID krävs.' });
    }

    if (myId === parseInt(friend_id)) {
        return res.status(400).json({ error: 'Du kan inte lägga till dig själv som vän.' });
    }

    try {
        // Kontrollera om det redan finns en förfrågan eller vänskap (sortera ID så user_id_1 alltid är lägst)
        const id1 = Math.min(myId, friend_id);
        const id2 = Math.max(myId, friend_id);

        const checkFriend = await db.query(
            'SELECT * FROM friends WHERE user_id_1 = $1 AND user_id_2 = $2',
            [id1, id2]
        );

        if (checkFriend.rows.length > 0) {
            return res.status(400).json({ error: 'En vänförfrågan eller vänskap finns redan mellan er.' });
        }

        // Skapa vänförfrågan (status blir automatiskt 'pending')
        await db.query(
            'INSERT INTO friends (user_id_1, user_id_2, status) VALUES ($1, $2, $3)',
            [id1, id2, 'pending']
        );

        res.status(201).json({ message: 'Vänförfrågan har skickats!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när vänförfrågan skulle skickas.' });
    }
});

// === NY ROUTE: Acceptera vänförfrågan ===
app.post('/api/friends/accept', auth, async (req, res) => {
    const { sender_id } = req.body;
    const myId = req.user.id; // Ditt ID (mottagaren)

    if (!sender_id) {
        return res.status(400).json({ error: 'Avsändarens ID krävs.' });
    }

    try {
        // Sortera ID på samma sätt som när förfrågan skapades
        const id1 = Math.min(myId, sender_id);
        const id2 = Math.max(myId, sender_id);

        // Kontrollera om förfrågan faktiskt existerar och är 'pending'
        const friendship = await db.query(
            'SELECT * FROM friends WHERE user_id_1 = $1 AND user_id_2 = $2',
            [id1, id2]
        );

        if (friendship.rows.length === 0) {
            return res.status(404).json({ error: 'Ingen vänförfrågan hittades mellan er.' });
        }

        if (friendship.rows[0].status === 'accepted') {
            return res.status(400).json({ error: 'Ni är redan vänner.' });
        }

        // Uppdatera statusen till 'accepted'
        await db.query(
            "UPDATE friends SET status = 'accepted' WHERE user_id_1 = $1 AND user_id_2 = $2",
            [id1, id2]
        );

        res.json({ message: 'Vänförfrågan accepterad! Ni är nu vänner.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när vänförfrågan skulle accepteras.' });
    }
});

// === NY ROUTE: Hämta lista över mina vänner ===
app.get('/api/friends', auth, async (req, res) => {
    const myId = req.user.id; // Ditt ID från JWT-token

    try {
        // Vi hämtar användarinfo för den person som INTE är jag i vänskapsrelationen
        const friendsList = await db.query(
            `SELECT u.id, u.name, u.email 
             FROM friends f
             JOIN users u ON (f.user_id_1 = u.id OR f.user_id_2 = u.id)
             WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) 
             AND f.status = 'accepted'
             AND u.id != $1`,
            [myId]
        );

        res.json({
            friends: friendsList.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när vänlistan skulle hämtas.' });
    }
});

// === UPPDATERAD ROUTE: Skapa lag och lägg till vänner direkt ===
app.post('/api/competitions/:competition_id/teams', auth, async (req, res) => {
    const { competition_id } = req.params;
    const { team_name, friend_ids } = req.body; // friend_ids ska vara en array, t.ex. [2, 3]
    const myId = req.user.id;

    if (!team_name) {
        return res.status(400).json({ error: 'Lagets namn krävs.' });
    }

    try {
        // 1. Kontrollera att det är JAG som har skapat tävlingen
        const compCheck = await db.query('SELECT * FROM competitions WHERE id = $1', [competition_id]);
        
        if (compCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tävlingen hittades inte.' });
        }

        if (compCheck.rows[0].created_by !== myId) {
            return res.status(403).json({ error: 'Endast Huvudadministratören får skapa lag.' });
        }

        // 2. Skapa laget
        const newTeam = await db.query(
            'INSERT INTO teams (name, competition_id) VALUES ($1, $2) RETURNING *',
            [team_name, competition_id]
        );

        const teamId = newTeam.rows[0].id;

        // 3. Om vänner skickades med, lägg till dem i team_members-tabellen
        if (friend_ids && Array.isArray(friend_ids) && friend_ids.length > 0) {
            
            // Vi bygger upp en dynamisk SQL-fråga för att sätta in alla vänner i en enda smäll
            // Resultatet blir t.ex: INSERT INTO team_members (team_id, user_id) VALUES (1, 2), (1, 3)
            const values = [];
            const valueStrings = [];
            
            friend_ids.forEach((id, index) => {
                const i = index * 2;
                values.push(teamId, id);
                valueStrings.push(`($${i + 1}, $${i + 2})`);
            });

            const insertMembersQuery = `
                INSERT INTO team_members (team_id, user_id) 
                VALUES ${valueStrings.join(', ')}
            `;

            await db.query(insertMembersQuery, values);
        }

        res.status(201).json({
            message: 'Laget har skapats och vännerna har lagts till i laget!',
            team: newTeam.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när laget och medlemmar skulle skapas.' });
    }
});

// === NY ROUTE: Registrera löpta kilometer ===
app.post('/api/activities', auth, async (req, res) => {
    const { distance, team_id } = req.body; // Distans i km och vilket lag det gäller
    const userId = req.user.id;

    if (!distance || !team_id) {
        return res.status(400).json({ error: 'Distans (km) och lag-ID krävs.' });
    }

    try {
        // 1. Kontrollera att användaren faktiskt är medlem i det laget
        const memberCheck = await db.query(
            'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
            [team_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Du är inte medlem i det här laget och kan inte registrera kilometer här.' });
        }

        // 2. Spara aktiviteten i databasen
        const newActivity = await db.query(
            'INSERT INTO activities (user_id, team_id, distance) VALUES ($1, $2, $3) RETURNING *',
            [userId, team_id, distance]
        );

        // 3. Uppdatera lagets totala kilometer (total_km) i teams-tabellen
        await db.query(
            'UPDATE teams SET total_km = total_km + $1 WHERE id = $2',
            [distance, team_id]
        );

        res.status(201).json({
            message: 'Aktivitet registrerad och lagets totala distans har uppdaterats!',
            activity: newActivity.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när aktiviteten skulle registreras.' });
    }
});

// === NY ROUTE: Hämta topplista för en tävling ===
app.get('/api/competitions/:competition_id/leaderboard', auth, async (req, res) => {
    const { competition_id } = req.params;

    try {
        // Hämta alla lag för tävlingen och sortera efter total_km (högst först)
        const leaderboard = await db.query(
            `SELECT id, name, tier, total_km 
             FROM teams 
             WHERE competition_id = $1 
             ORDER BY total_km DESC`,
            [competition_id]
        );

        if (leaderboard.rows.length === 0) {
            return res.status(404).json({ message: 'Inga lag hittades för denna tävling än.' });
        }

        res.json({
            competition_id: competition_id,
            leaderboard: leaderboard.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Serverfel när topplistan skulle hämtas.' });
    }
});

// === NEW ROUTE: Assign extra admins to a competition (Max 4) ===
app.post('/api/competitions/:competition_id/admins', auth, async (req, res) => {
    const { competition_id } = req.params;
    const { user_id_to_promote } = req.body; // The ID of the user becoming admin
    const myId = req.user.id;

    try {
        // 1. Verify that I am the main_admin (creator) of this competition
        const compCheck = await db.query('SELECT * FROM competitions WHERE id = $1', [competition_id]);
        
        if (compCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Competition not found.' });
        }

        if (compCheck.rows[0].created_by !== myId) {
            return res.status(403).json({ error: 'Only the main administrator can assign other admins.' });
        }

        // 2. Count current extra admins for this competition
        const adminCount = await db.query(
            "SELECT COUNT(*) FROM competition_members WHERE competition_id = $1 AND role = 'admin'",
            [competition_id]
        );

        if (parseInt(adminCount.rows[0].count) >= 4) {
            return res.status(400).json({ error: 'Maximum limit of 4 extra administrators has been reached.' });
        }

        // 3. Update the user's role to 'admin' inside the competition
        const updatedMember = await db.query(
            "UPDATE competition_members SET role = 'admin' WHERE competition_id = $1 AND user_id = $2 RETURNING *",
            [competition_id, user_id_to_promote]
        );

        if (updatedMember.rows.length === 0) {
            return res.status(404).json({ error: 'User is not a member of this competition.' });
        }

        res.json({
            message: 'User has been successfully promoted to admin.',
            member: updatedMember.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while assigning admin role.' });
    }
});

// === NEW ROUTE: Invite a friend to a competition ===
app.post('/api/competitions/:competition_id/invite', auth, async (req, res) => {
    const { competition_id } = req.params;
    const { user_id_to_invite } = req.body;
    const myId = req.user.id;

    try {
        // 1. Check if the logged-in user is an admin or main_admin
        const myRoleCheck = await db.query(
            "SELECT role FROM competition_members WHERE competition_id = $1 AND user_id = $2",
            [competition_id, myId]
        );
        const isMainAdminCheck = await db.query(
            "SELECT * FROM competitions WHERE id = $1 AND created_by = $2",
            [competition_id, myId]
        );

        if (isMainAdminCheck.rows.length === 0 && (myRoleCheck.rows.length === 0 || myRoleCheck.rows[0].role !== 'admin')) {
            return res.status(403).json({ error: 'Only administrators can invite users to this competition.' });
        }

        // 2. Insert the invited user with 'pending' status
        const newInvite = await db.query(
            `INSERT INTO competition_members (competition_id, user_id, role, status) 
             VALUES ($1, $2, 'participant', 'pending') 
             RETURNING *`,
            [competition_id, user_id_to_invite]
        );

        res.status(201).json({
            message: 'Invitation sent successfully.',
            invite: newInvite.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') { // Unique violation if already invited
            return res.status(400).json({ error: 'This user is already invited or a member of this competition.' });
        }
        res.status(500).json({ error: 'Server error while sending invitation.' });
    }
});

// === NEW ROUTE: Get all pending competition invitations for the logged-in user ===
app.get('/api/users/me/competition-invitations', auth, async (req, res) => {
    const myId = req.user.id;

    try {
        const invitations = await db.query(
            `SELECT cm.id AS membership_id, c.id AS competition_id, c.name AS competition_name, c.created_at 
             FROM competition_members cm
             JOIN competitions c ON cm.competition_id = c.id
             WHERE cm.user_id = $1 AND cm.status = 'pending'`,
            [myId]
        );

        res.json({ invitations: invitations.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching invitations.' });
    }
});

// === NEW ROUTE: Get team leaderboard with nested members and their distances ===
app.get('/api/competitions/:competition_id/teams-leaderboard', auth, async (req, res) => {
    const { competition_id } = req.params;

    try {
        // This query fetches teams and aggregates their members into a JSON array
        const teamsQuery = `
            SELECT 
                t.id AS team_id,
                t.name AS team_name,
                t.total_km AS team_total_km,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'user_id', u.id,
                            'name', u.name,
                            'individual_km', COALESCE(
                                (SELECT SUM(distance) FROM activities WHERE user_id = u.id AND team_id = t.id), 0
                            )
                        )
                    ) FILTER (WHERE u.id IS NOT NULL), '[]'
                ) AS members
            FROM teams t
            LEFT JOIN team_members tm ON t.id = tm.team_id
            LEFT JOIN users u ON tm.user_id = u.id
            WHERE t.competition_id = $1
            GROUP BY t.id
            ORDER BY t.total_km DESC;
        `;

        const result = await db.query(teamsQuery, [competition_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No teams found for this competition.' });
        }

        res.json({
            competition_id: competition_id,
            leaderboard: result.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching teams leaderboard.' });
    }
});

// === NEW ROUTE: Get all competitions the logged-in user is an active member of ===
app.get('/api/users/me/competitions', auth, async (req, res) => {
    const myId = req.user.id;

    try {
        const myCompetitions = await db.query(
            `SELECT c.id AS competition_id, c.name AS competition_name, cm.role, cm.tier, c.created_at
             FROM competition_members cm
             JOIN competitions c ON cm.competition_id = c.id
             WHERE cm.user_id = $1 AND cm.status = 'accepted'
             ORDER BY c.created_at DESC`,
            [myId]
        );

        res.json({ competitions: myCompetitions.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching your competitions.' });
    }
});

// === NEW ROUTE: Update team name (Admins only) ===
app.put('/api/competitions/:competition_id/teams/:team_id', auth, async (req, res) => {
    const { competition_id, team_id } = req.params;
    const { new_team_name } = req.body;
    const myId = req.user.id;

    if (!new_team_name) {
        return res.status(400).json({ error: 'New team name is required.' });
    }

    try {
        // 1. Check if the logged-in user is an admin or main_admin
        const myRoleCheck = await db.query(
            "SELECT role FROM competition_members WHERE competition_id = $1 AND user_id = $2",
            [competition_id, myId]
        );
        const isMainAdminCheck = await db.query(
            "SELECT * FROM competitions WHERE id = $1 AND created_by = $2",
            [competition_id, myId]
        );

        const isMainAdmin = isMainAdminCheck.rows.length > 0;
        const isAdmin = myRoleCheck.rows.length > 0 && myRoleCheck.rows[0].role === 'admin';

        if (!isMainAdmin && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. Only administrators can edit teams.' });
        }

        // 2. Update the team name
        const updatedTeam = await db.query(
            "UPDATE teams SET name = $1 WHERE id = $2 AND competition_id = $3 RETURNING *",
            [new_team_name, team_id, competition_id]
        );

        if (updatedTeam.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found in this competition.' });
        }

        res.json({
            message: 'Team name updated successfully.',
            team: updatedTeam.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while updating team name.' });
    }
});

// === NEW ROUTE: Delete a team (Admins only) ===
app.delete('/api/competitions/:competition_id/teams/:team_id', auth, async (req, res) => {
    const { competition_id, team_id } = req.params;
    const myId = req.user.id;

    try {
        // 1. Check if the logged-in user is an admin or main_admin
        const myRoleCheck = await db.query(
            "SELECT role FROM competition_members WHERE competition_id = $1 AND user_id = $2",
            [competition_id, myId]
        );
        const isMainAdminCheck = await db.query(
            "SELECT * FROM competitions WHERE id = $1 AND created_by = $2",
            [competition_id, myId]
        );

        const isMainAdmin = isMainAdminCheck.rows.length > 0;
        const isAdmin = myRoleCheck.rows.length > 0 && myRoleCheck.rows[0].role === 'admin';

        if (!isMainAdmin && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. Only administrators can delete teams.' });
        }

        // 2. Delete the team (ON DELETE CASCADE will automatically remove members from team_members)
        const deletedTeam = await db.query(
            "DELETE FROM teams WHERE id = $1 AND competition_id = $2 RETURNING *",
            [team_id, competition_id]
        );

        if (deletedTeam.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found in this competition.' });
        }

        res.json({
            message: 'Team deleted successfully.'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while deleting team.' });
    }
});

// === NEW ROUTE: Update competition name (Main Admin only) ===
app.put('/api/competitions/:competition_id', auth, async (req, res) => {
    const { competition_id } = req.params;
    const { new_competition_name } = req.body;
    const myId = req.user.id;

    if (!new_competition_name) {
        return res.status(400).json({ error: 'New competition name is required.' });
    }

    try {
        // Only the main_admin (creator) should be allowed to change the competition details
        const compCheck = await db.query('SELECT * FROM competitions WHERE id = $1', [competition_id]);
        
        if (compCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Competition not found.' });
        }

        if (compCheck.rows[0].created_by !== myId) {
            return res.status(403).json({ error: 'Access denied. Only the Main Administrator can edit the competition settings.' });
        }

        const updatedComp = await db.query(
            "UPDATE competitions SET name = $1 WHERE id = $2 RETURNING *",
            [new_competition_name, competition_id]
        );

        res.json({
            message: 'Competition name updated successfully.',
            competition: updatedComp.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while updating competition.' });
    }
});

// === NEW ROUTE: Remove a participant from the competition (Admins only) ===
app.delete('/api/competitions/:competition_id/members/:user_id', auth, async (req, res) => {
    const { competition_id, user_id } = req.params;
    const myId = req.user.id;

    // Prevent blocking/deleting yourself from the admin route
    if (parseInt(user_id) === myId) {
        return res.status(400).json({ error: 'You cannot remove yourself using this route. Use the leave route instead.' });
    }

    try {
        // 1. Check if the logged-in user is an admin or main_admin
        const myRoleCheck = await db.query(
            "SELECT role FROM competition_members WHERE competition_id = $1 AND user_id = $2",
            [competition_id, myId]
        );
        const isMainAdminCheck = await db.query(
            "SELECT * FROM competitions WHERE id = $1 AND created_by = $2",
            [competition_id, myId]
        );

        const isMainAdmin = isMainAdminCheck.rows.length > 0;
        const isAdmin = myRoleCheck.rows.length > 0 && myRoleCheck.rows[0].role === 'admin';

        if (!isMainAdmin && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. Only administrators can remove participants.' });
        }

        // 2. Protect the Main Admin from being removed by extra admins
        const targetCheck = await db.query('SELECT created_by FROM competitions WHERE id = $1', [competition_id]);
        if (targetCheck.rows[0].created_by === parseInt(user_id)) {
            return res.status(403).json({ error: 'Action denied. The Main Administrator cannot be removed.' });
        }

        // 3. Remove the participant from the competition
        const removedMember = await db.query(
            "DELETE FROM competition_members WHERE competition_id = $1 AND user_id = $2 RETURNING *",
            [competition_id, user_id]
        );

        if (removedMember.rows.length === 0) {
            return res.status(404).json({ error: 'Participant not found in this competition.' });
        }

        // 4. Also remove them from any team they are currently in within this competition
        await db.query(
            `DELETE FROM team_members 
             WHERE user_id = $1 AND team_id IN (SELECT id FROM teams WHERE competition_id = $2)`,
            [user_id, competition_id]
        );

        res.json({
            message: 'Participant has been successfully removed from the competition and their team.'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while removing participant.' });
    }
});

// === NEW ROUTE: Leave a team (Participant self-service) ===
app.delete('/api/competitions/:competition_id/teams/:team_id/leave', auth, async (req, res) => {
    const { competition_id, team_id } = req.params;
    const myId = req.user.id;

    try {
        // Remove the logged-in user from the specific team
        const result = await db.query(
            "DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING *",
            [team_id, myId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'You are not a member of this team.' });
        }

        res.json({ message: 'You have successfully left the team.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while leaving the team.' });
    }
});

// === NEW ROUTE: Leave a competition completely (Participant self-service) ===
app.delete('/api/competitions/:competition_id/leave', auth, async (req, res) => {
    const { competition_id } = req.params;
    const myId = req.user.id;

    try {
        // 1. Protect the Main Admin – they cannot just leave, they must delete or transfer it
        const compCheck = await db.query('SELECT created_by FROM competitions WHERE id = $1', [competition_id]);
        
        if (compCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Competition not found.' });
        }

        if (compCheck.rows[0].created_by === myId) {
            return res.status(403).json({ error: 'As the Main Administrator, you cannot leave. You must delete the competition instead.' });
        }

        // 2. Remove from the competition membership
        const result = await db.query(
            "DELETE FROM competition_members WHERE competition_id = $1 AND user_id = $2 RETURNING *",
            [competition_id, myId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'You are not a member of this competition.' });
        }

        // 3. Automatically clean up and remove them from any team inside this competition
        await db.query(
            `DELETE FROM team_members 
             WHERE user_id = $1 AND team_id IN (SELECT id FROM teams WHERE competition_id = $2)`,
            [myId, competition_id]
        );

        res.json({ message: 'You have successfully left the competition and your team.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while leaving the competition.' });
    }
});

// === UPDATED ROUTE: Register activity with competition end-date enforcement ===
app.post('/api/activities', auth, async (req, res) => {
    const { distance, team_id } = req.body;
    const myId = req.user.id;

    if (!distance || !team_id) {
        return res.status(400).json({ error: 'Distance and team_id are required.' });
    }

    try {
        // 1. Check if the user is actually a member of the team
        const memberCheck = await db.query(
            "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2",
            [team_id, myId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this team.' });
        }

        // 2. CRITICAL ANTI-CHEAT: Check if the competition has already ended
        const compCheck = await db.query(
            `SELECT c.end_date 
             FROM teams t
             JOIN competitions c ON t.competition_id = c.id
             WHERE t.id = $1`,
            [team_id]
        );

        const endDate = new Date(compCheck.rows[0].end_date);
        const now = new Date();

        if (now > endDate) {
            return res.status(400).json({ error: 'Action denied. This competition has already ended, and no more distances can be logged.' });
        }

        // 3. Insert the new activity
        const newActivity = await db.query(
            "INSERT INTO activities (user_id, team_id, distance) VALUES ($1, $2, $3) RETURNING *",
            [myId, team_id, distance]
        );

        // 4. Update the team's total kilometers
        await db.query(
            "UPDATE teams SET total_km = total_km + $1 WHERE id = $2",
            [distance, team_id]
        );

        res.status(201).json({
            message: 'Activity registered successfully and team total updated.',
            activity: newActivity.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while registering activity.' });
    }
});

// === NEW ROUTE: Update privacy setting (public or private) ===
app.put('/api/users/me/privacy', auth, async (req, res) => {
    const { privacy_setting } = req.body; // Expected: 'public' or 'private'
    const myId = req.user.id;

    if (!privacy_setting || (privacy_setting !== 'public' && privacy_setting !== 'private')) {
        return res.status(400).json({ error: "Invalid setting. Must be either 'public' or 'private'." });
    }

    try {
        const updatedUser = await db.query(
            "UPDATE users SET privacy_setting = $1 WHERE id = $2 RETURNING id, name, email, privacy_setting",
            [privacy_setting, myId]
        );

        res.json({
            message: `Privacy setting successfully updated to ${privacy_setting}.`,
            user: updatedUser.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while updating privacy setting.' });
    }
});

// === NEW ROUTE: Get a user's profile statistics (With privacy protection) ===
app.get('/api/users/:user_id/profile', auth, async (req, res) => {
    const targetUserId = req.params.user_id;
    const myId = req.user.id;

    try {
        // 1. Fetch the target user's privacy setting and name
        const userCheck = await db.query("SELECT id, name, privacy_setting FROM users WHERE id = $1", [targetUserId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const targetUser = userCheck.rows[0];

        // 2. Enforcement: If private and NOT me, block the access!
        if (targetUser.privacy_setting === 'private' && parseInt(targetUserId) !== myId) {
            return res.status(403).json({ error: 'This profile is private.' });
        }

        // 3. If public (or it is me), fetch total stats (total km and total activities)
        const statsQuery = `
            SELECT 
                COALESCE(SUM(distance), 0) AS total_distance_km,
                COUNT(*) AS total_activities
            FROM activities 
            WHERE user_id = $1
        `;
        const statsResult = await db.query(statsQuery, [targetUserId]);

        res.json({
            user_id: targetUser.id,
            name: targetUser.name,
            privacy_setting: targetUser.privacy_setting,
            statistics: statsResult.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching profile.' });
    }
});

// === NEW ROUTE: Delete an activity and deduct distance from team (Admins only) ===
app.delete('/api/competitions/:competition_id/activities/:activity_id', auth, async (req, res) => {
    const { competition_id, activity_id } = req.params;
    const myId = req.user.id;

    try {
        // 1. Check if the logged-in user is an admin or main_admin
        const myRoleCheck = await db.query(
            "SELECT role FROM competition_members WHERE competition_id = $1 AND user_id = $2",
            [competition_id, myId]
        );
        const isMainAdminCheck = await db.query(
            "SELECT * FROM competitions WHERE id = $1 AND created_by = $2",
            [competition_id, myId]
        );

        const isMainAdmin = isMainAdminCheck.rows.length > 0;
        const isAdmin = myRoleCheck.rows.length > 0 && myRoleCheck.rows[0].role === 'admin';

        if (!isMainAdmin && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. Only administrators can delete activities.' });
        }

        // 2. Fetch the activity to know how many kilometers to deduct and which team it belongs to
        const activityCheck = await db.query(
            `SELECT a.distance, a.team_id 
             FROM activities a
             JOIN teams t ON a.team_id = t.id
             WHERE a.id = $1 AND t.competition_id = $2`,
            [activity_id, competition_id]
        );

        if (activityCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found in this competition.' });
        }

        const { distance, team_id } = activityCheck.rows[0];

        // 3. Delete the activity
        await db.query("DELETE FROM activities WHERE id = $1", [activity_id]);

        // 4. DEDUCT the distance from the team's total_km
        await db.query(
            "UPDATE teams SET total_km = GREATEST(0, total_km - $1) WHERE id = $2",
            [distance, team_id]
        );

        res.json({
            message: `Activity successfully deleted. ${distance} km has been deducted from the team total.`
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while deleting activity.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servern är igång på port ${PORT}`);
});