import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('cart');
      if (storagedProducts) {
        const savedItems = JSON.parse(storagedProducts);
        setProducts(savedItems);
      }
    }

    loadProducts();
  }, []);

  const handleStoreData = useCallback(async () => {
    await AsyncStorage.setItem('cart', JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const newProduct = product;
      if (!newProduct.quantity) {
        newProduct.quantity = 1;
      }
      setProducts([...products, newProduct]);
      await handleStoreData();
    },
    [products, handleStoreData],
  );

  const increment = useCallback(
    async id => {
      const newArrayOfProducts = products.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });
      setProducts([...newArrayOfProducts]);
      await handleStoreData();
    },
    [products, handleStoreData],
  );

  const decrement = useCallback(
    async id => {
      let newArrayOfProducts = products;

      const productIndex = newArrayOfProducts.findIndex(
        product => product.id === id,
      );

      if (productIndex > -1) {
        const changedProduct = newArrayOfProducts[productIndex];
        if (changedProduct.quantity > 1) {
          changedProduct.quantity -= 1;
        } else {
          newArrayOfProducts = products.filter(product => product.id !== id);
        }
      }
      setProducts([...newArrayOfProducts]);
      await handleStoreData();
    },
    [products, handleStoreData],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
