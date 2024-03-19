import { Router } from "express";
import passport from 'passport';

const router = Router();

// Ruta de registro
router.post('/register', (req, res, next) => {
    passport.authenticate('register', (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Failed to register' });
        }
        req.session.user = user; // Almacena la información del usuario en la sesión
        return res.status(200).json({ message: 'Registration successful' });
    })(req, res, next);
});

// Ruta de fallo en el registro
router.get('/failRegister', (req, res) => {
    res.status(400).json({ error: 'Failed to register' });
});

// Ruta de inicio de sesión
router.post('/login', passport.authenticate('login', { failureRedirect: '/api/sessions/failLogin' }), async (req, res) => {
    req.session.user = req.user; // Almacena la información del usuario en la sesión
    res.status(200).json({ message: 'Login successful' });
}, (err, req, res, next) => {
    console.error("Error en la autenticación:", err);
    res.status(500).json({ error: 'Error de servidor' });
});

// Ruta de fallo en el inicio de sesión
router.get('/failLogin', (req, res) => {
    res.status(400).json({ error: 'Failed to login' });
});

// Ruta de inicio de sesión con GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// Ruta de retorno de GitHub
router.get('/githubcallback', passport.authenticate('github', { failureRedirect: '/login' }), async (req, res) => {
    req.session.user = req.user; // Almacena la información del usuario en la sesión
    res.redirect('/'); // Redirige al usuario a la página de inicio
});

export default router;
