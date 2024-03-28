import { Router } from "express";
import passport from 'passport';
import Cart from '../dao/models/cart.model.js'

const router = Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res, next) => {
    passport.authenticate('register', async (err, user, info) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register' });
      }
      if (!user) {
        return res.status(400).json({ error: 'Failed to register' });
      }
      try {
        // Crear un nuevo carrito para el usuario
        const newCart = await Cart.create({ products: [] });

        // Asociar el ID del nuevo carrito al campo "cart" del usuario
        user.cart = newCart._id;
        await user.save();

        // Iniciar sesión después del registro
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json({ message: 'Registration and login successful' });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to register' });
    }
    })(req, res, next);
});

// Ruta para manejar fallos en el registro
router.get('/failRegister', (req, res) => {
    res.send({ error: 'Failed to register' });
});

// Ruta para iniciar sesión
router.post('/login', passport.authenticate('login', { failureRedirect: '/api/sessions/failLogin'}), async (req, res) => {
    req.session.user = req.user;
    res.status(200).json({ message: 'Login successful' });
}, (err) => {
    console.error("Error en la autenticación:", err);
    res.status(500).send({ error: 'Error de servidor' });
});

// Ruta para manejar fallos en el inicio de sesión
router.get('/failLogin', (req, res) => {
    res.send({ error: 'Failed to login' });
});

// Ruta para autenticación con GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }), async (req, res) => {
    // Aquí puedes agregar lógica adicional si es necesario
});

// Ruta de callback después de autenticación con GitHub
router.get('/githubcallback', passport.authenticate('github', { failureRedirect: '/login' }), async (req, res) => {
    console.log('Callback: ', req.user);
    req.session.user = req.user;
    console.log('User session: ', req.session.user);
    res.redirect('/');
});

// Ruta para obtener la sesión actual del usuario
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Si el usuario está autenticado, devuelve los detalles del usuario actual
    const user = {
      _id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      age: req.user.age,
      cart: req.user.cart,
      role: req.user.role
    };
    console.log('User: ', user);
    res.status(200).json(user);
});

export default router;
