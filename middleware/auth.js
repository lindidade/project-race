const jwt = require('jsonwebtoken');

// 1. Dörrvakt för att kolla om användaren överhuvudtaget är inloggad (har en giltig token)
const auth = (req, res, next) => {
    // Hämta token från headern "Authorization"
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Åtkomst nekad. Ingen token tillhandahållen.' });
    }

    try {
        // Validera token med vår hemliga nyckel
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lägg till användarens info (id, role, tier) i req-objektet
        next(); // Släpp vidare användaren till nästa funktion
    } catch (err) {
        res.status(401).json({ error: 'Ogiltig token.' });
    }
};

// 2. Dörrvakt för att kolla om användaren har en specifik roll (t.ex. admin)
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Kontrollera om användarens roll finns med i listan över tillåtna roller
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Åtkomst nekad. Du har inte rätt behörighet för detta.' });
        }
        next(); // Användaren har rätt roll, släpp vidare!
    };
};

module.exports = { auth, authorize };