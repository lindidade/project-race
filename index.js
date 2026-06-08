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

app.listen(PORT, () => {
    console.log(`Servern är igång på port ${PORT}`);
});