// authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/login');
    }
  };
  
  const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Acceso no autorizado.' });
    }
  };
  
  const hasAdminCredentials = (email, password) => {
    // Verificar si las credenciales coinciden con las del administrador
    return email === 'adminCoder@coder.com' && password === 'adminCod3r123';
  };
  
  export { isAuthenticated, isAdmin, hasAdminCredentials };