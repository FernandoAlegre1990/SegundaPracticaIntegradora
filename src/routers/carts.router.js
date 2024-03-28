import { Router } from "express";
import Cart from '../dao/models/cart.model.js';
import Product from '../dao/models/product.model.js';
import User from '../dao/models/user.model.js';

const router = Router();

// const filePathProducts = './src/productos.json';
// const filePathCarts = './src/carrito.json';

router.get('/', async (req, res) => {
    try {
        const carts = await Cart.find().lean().exec();
        res.status(200).json(carts);
    } catch (error) {
        console.log('Error al obtener los carritos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
  
router.get('/:cid', async (req, res) => {
    try {
      const cartId = req.params.cid;
      const cart = await Cart.findById(cartId).populate('products.product').lean().exec();
  
      if (!cart) {
        res.status(404).json({ error: 'Carrito no encontrado' });
        return;
      }
      
      // Obtener la información completa de los productos utilizando el populate
      const productsWithInfo = await Product.populate(cart, {
        path: 'products.product',
        model: 'products',
      });

      res.status(200).json(productsWithInfo);

      // res.status(200).json(cart.products);
    } catch (error) {
      console.log('Error al obtener los productos del carrito:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });
  
  router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;

        // Obtén el usuario actual
        const userId = req.session.user._id; // Obtener el ID del usuario de la sesión
        const user = await User.findById(userId);

        const product = await Product.findById(productId).lean().exec();

        if (!product) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }

        const cart = await Cart.findById(cartId).lean().exec();

        if (!cart) {
            res.status(404).json({ error: 'Carrito no encontrado' });
            return;
        }

        const existingProductIndex = cart.products.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingProductIndex !== -1) {
            // Si el producto ya está en el carrito, incrementar la cantidad
            cart.products[existingProductIndex].quantity++;
        } else {
            // Si el producto no está en el carrito, agregarlo con cantidad 1
            cart.products.push({
                product: productId,
                quantity: 1
            });
        }

        await Cart.findByIdAndUpdate(cartId, { products: cart.products }).exec();

        // Verificar si user.cart está definido
        if (!user.cart) {
            // Si user.cart no está definido, crear un nuevo carrito
            user.cart = { products: [] };
        }

        // Agregar el producto al carrito
        user.cart.products.push({
            product: productId,
            quantity: 1
        });

        // Guardar el usuario actualizado en la base de datos
        await user.save();

        res.status(201).json(cart);
    } catch (error) {
        console.log('Error al agregar producto al carrito:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// PUT api/carts/:cid/products/:pid deberá poder actualizar SÓLO la cantidad de ejemplares del producto por cualquier cantidad pasada desde req.body
router.put('/:cid/products/:pid', async (req, res) => {
  try {
      const cartId = req.params.cid;
      const productId = req.params.pid;
      const { quantity } = req.body;

      const cart = await Cart.findById(cartId).lean().exec();

      if (!cart) {
          res.status(404).json({ error: 'Carrito no encontrado' });
          return;
      }

      const existingProductIndex = cart.products.findIndex(
          (item) => item.product.toString() === productId
      );

      if (existingProductIndex === -1) {
          res.status(404).json({ error: 'Producto no encontrado en el carrito' });
          return;
      }

      const updatedProducts = [...cart.products];
      updatedProducts[existingProductIndex].quantity = quantity;

      await Cart.findByIdAndUpdate(cartId, { products: updatedProducts }).exec();

      res.status(200).json({ message: 'Cantidad de producto actualizada satisfactoriamente' });
  } catch (error) {
      console.log('Error al actualizar cantidad de producto en el carrito:', error);
      res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.delete('/:cid', async (req, res) => {
  try {
      const cartId = req.params.cid;

      const cart = await Cart.findById(cartId).lean().exec();

      if (!cart) {
          res.status(404).json({ error: 'Carrito no encontrado' });
          return;
      }

      // Vaciar el array de productos del carrito
      cart.products = [];

      await Cart.findByIdAndUpdate(cartId, { products: cart.products }).exec();

      res.status(200).json({ message: 'Carrito vaciado satisfactoriamente' });
  } catch (error) {
      console.log('Error al vaciar el carrito:', error);
      res.status(500).json({ error: 'Error en el servidor' });
  }
});

  // DELETE api/carts/:cid/products/:pid deberá eliminar del carrito el producto seleccionado.
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
      const cartId = req.params.cid;
      const productId = req.params.pid;

      const cart = await Cart.findById(cartId).lean().exec();

      if (!cart) {
          res.status(404).json({ error: 'Carrito no encontrado' });
          return;
      }

      // Filtrar los productos y eliminar el producto específico del carrito
      cart.products = cart.products.filter((item) => item.product.toString() !== productId);

      await Cart.findByIdAndUpdate(cartId, { products: cart.products }).exec();

      res.status(200).json({ message: 'Producto eliminado del carrito satisfactoriamente' });
  } catch (error) {
      console.log('Error al eliminar producto del carrito:', error);
      res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;