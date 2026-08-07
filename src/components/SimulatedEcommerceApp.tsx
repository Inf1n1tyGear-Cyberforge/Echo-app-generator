import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, ArrowLeft, Trash2, Plus, Minus,
  Search, Star, Tag, Package, CreditCard,
  CheckCircle2, Sparkles, Heart, MapPin,
  ChevronRight, X,
} from 'lucide-react';
import { eventRecorder } from '../lib/event-recorder';

// ── Types ───────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  image: string;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type Page = 'catalog' | 'detail' | 'cart' | 'checkout' | 'confirmation';

// ── Sample products ──────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Wireless Headphones', price: 79.99, category: 'Electronics', rating: 4.5, image: '🎧', description: 'Premium noise-cancelling wireless headphones with 30hr battery life.' },
  { id: 'p2', name: 'Sneakers Ultra', price: 129.99, category: 'Fashion', rating: 4.8, image: '👟', description: 'Lightweight running sneakers with responsive cushioning.' },
  { id: 'p3', name: 'Smart Water Bottle', price: 34.99, category: 'Lifestyle', rating: 4.2, image: '💧', description: 'Temperature tracking smart bottle with hydration reminders.' },
  { id: 'p4', name: 'Laptop Stand', price: 49.99, category: 'Electronics', rating: 4.3, image: '💻', description: 'Ergonomic aluminum laptop stand with adjustable height.' },
  { id: 'p5', name: 'Yoga Mat Premium', price: 44.99, category: 'Fitness', rating: 4.6, image: '🧘', description: 'Extra thick non-slip yoga mat with carrying strap.' },
  { id: 'p6', name: 'Desk Organizer', price: 24.99, category: 'Lifestyle', rating: 4.0, image: '📦', description: 'Modular bamboo desk organizer for a clutter-free workspace.' },
];

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Lifestyle', 'Fitness'];

let idCounter = 0;
const genId = () => `ecom-${++idCounter}-${Date.now()}`;

// ── Component ────────────────────────────────────────────
export default function SimulatedEcommerceApp() {
  const [currentPage, setCurrentPage] = useState<Page>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', address: '', card: '' });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showAddToCartConfetti, setShowAddToCartConfetti] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      eventRecorder.captureNavigation('demo://shop', 'ShopWave - E-commerce');
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────
  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Cart Actions ──────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setShowAddToCartConfetti(true);
    setTimeout(() => setShowAddToCartConfetti(false), 1200);
    eventRecorder.captureClick(`Add to Cart: "${product.name}"`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
    );
    eventRecorder.captureClick(`Update quantity: ${productId} (${delta > 0 ? '+' : ''}${delta})`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    eventRecorder.captureClick(`Remove from cart: ${productId}`);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    eventRecorder.captureClick(`Toggle favorite: ${productId}`);
  };

  // ── Page Navigation ──────────────────────────────────────
  const navigateTo = (page: Page, product?: Product) => {
    if (product) setSelectedProduct(product);
    setCurrentPage(page);
    eventRecorder.captureNavigation(
      `demo://shop/${page}${product ? `/${product.id}` : ''}`,
      `ShopWave - ${page.charAt(0).toUpperCase() + page.slice(1)}`
    );
  };

  // ── Checkout ────────────────────────────────────────────
  const handleCheckout = () => {
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) return;
    setOrderPlaced(true);
    setCurrentPage('confirmation');
    setCart([]);
    eventRecorder.captureClick('Place Order');
    eventRecorder.captureInput('checkout-name', checkoutForm.name);
    eventRecorder.captureInput('checkout-email', checkoutForm.email);
  };

  // ── Render: Catalog ────────────────────────────────────
  const renderCatalog = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">ShopWave</h2>
            <p className="text-[10px] text-text-dim">E-commerce Store</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTo('cart')}
            className="relative p-2 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-5 py-3 border-b border-border/20 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field text-sm pl-10"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="px-5 py-3 border-b border-border/20 shrink-0 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); eventRecorder.captureClick(`Filter category: ${cat}`); }}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 text-text-muted hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Search className="w-10 h-10 text-text-dim mb-3" />
            <h3 className="text-sm font-bold text-foreground mb-1">No products found</h3>
            <p className="text-xs text-text-muted max-w-[220px]">
              Try a different category or search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, i) => (
              <div
                key={product.id}
                className="card p-3 group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => navigateTo('detail', product)}
                onKeyDown={e => e.key === 'Enter' && navigateTo('detail', product)}
                role="button"
                tabIndex={0}
              >
                {/* Product image placeholder */}
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/10 via-surface to-accent/10 flex items-center justify-center text-4xl mb-2.5 border border-border/30">
                  {product.image}
                </div>

                {/* Info */}
                <h3 className="text-xs font-semibold text-foreground truncate mb-0.5">{product.name}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] text-text-dim">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">${product.price.toFixed(2)}</span>
                  <button
                    onClick={e => { e.stopPropagation(); addToCart(product); }}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    title="Add to cart"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add to cart confetti */}
        {showAddToCartConfetti && (
          <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="flex gap-2 animate-fade-in">
              {['🎉', '✨', '🎊'].map((emoji, i) => (
                <span key={i} className="text-2xl" style={{ animation: `float-up 0.8s ease-out ${i * 0.1}s forwards`, opacity: 0 }}>{emoji}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Product Detail ────────────────────────────
  const renderDetail = () => {
    if (!selectedProduct) return null;
    const isFav = favorites.includes(selectedProduct.id);

    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigateTo('catalog')}
            className="p-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground">Product Details</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Image area */}
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary/10 via-surface to-accent/10 flex items-center justify-center text-7xl mb-5 border border-border/30">
              {selectedProduct.image}
            </div>

            {/* Title & price */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{selectedProduct.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-text-dim">{selectedProduct.rating}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(selectedProduct.id)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isFav ? 'text-pink-500 bg-pink-500/10' : 'text-text-dim hover:text-foreground'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* Price */}
            <div className="text-2xl font-bold gradient-text mb-4">
              ${selectedProduct.price.toFixed(2)}
            </div>

            {/* Description */}
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              {selectedProduct.description}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => addToCart(selectedProduct)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => { addToCart(selectedProduct); navigateTo('cart'); }}
                className="btn-secondary flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Cart ──────────────────────────────────────
  const renderCart = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigateTo('catalog')}
          className="p-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-foreground">Shopping Cart</h2>
          <p className="text-[10px] text-text-dim">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={() => { setCart([]); eventRecorder.captureClick('Clear cart'); }}
            className="text-xs text-destructive hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart className="w-12 h-12 text-text-dim mb-3" />
            <h3 className="text-sm font-bold text-foreground mb-1">Your cart is empty</h3>
            <p className="text-xs text-text-muted max-w-[200px] mb-5">
              Browse products and add items you love to your cart.
            </p>
            <button
              onClick={() => navigateTo('catalog')}
              className="btn-primary text-sm py-2 px-5 cursor-pointer"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.product.id} className="card p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-xl shrink-0 border border-border/30">
                  {item.product.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{item.product.name}</h4>
                  <p className="text-xs text-text-muted">${item.product.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 rounded-md bg-muted/50 text-text-dim hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 rounded-md bg-muted/50 text-text-dim hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-bold text-foreground w-16 text-right">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 rounded-lg text-text-dim hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Subtotal */}
            <div className="border-t border-border/30 pt-3 mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-foreground font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-dim mb-3">
                <span>Shipping</span>
                <span>{cartTotal > 50 ? 'FREE' : '$5.99'}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold mb-4">
                <span className="text-foreground">Total</span>
                <span className="gradient-text">${(cartTotal + (cartTotal > 50 ? 0 : 5.99)).toFixed(2)}</span>
              </div>
              <button
                onClick={() => navigateTo('checkout')}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Proceed to Checkout
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Checkout ──────────────────────────────────
  const renderCheckout = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigateTo('cart')}
          className="p-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">Checkout</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          {/* Order summary */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted truncate max-w-[180px]">{item.product.name} × {item.quantity}</span>
                  <span className="text-foreground">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/30 mt-3 pt-3 flex justify-between text-sm font-bold">
              <span className="text-foreground">Total</span>
              <span className="gradient-text">${(cartTotal + (cartTotal > 50 ? 0 : 5.99)).toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping form */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Shipping Details
            </h3>
            <div className="space-y-3">
              <input
                value={checkoutForm.name}
                onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="input-field text-sm"
              />
              <input
                value={checkoutForm.email}
                onChange={e => setCheckoutForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email address"
                type="email"
                className="input-field text-sm"
              />
              <input
                value={checkoutForm.address}
                onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Shipping address"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Payment
            </h3>
            <input
              value={checkoutForm.card}
              onChange={e => setCheckoutForm(f => ({ ...f, card: e.target.value }))}
              placeholder="Card number (demo)"
              className="input-field text-sm"
            />
            <p className="text-[10px] text-text-dim mt-2">Demo mode — no real payment will be processed</p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!checkoutForm.name || !checkoutForm.email || !checkoutForm.address}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Place Order — ${(cartTotal + (cartTotal > 50 ? 0 : 5.99)).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render: Confirmation ──────────────────────────────
  const renderConfirmation = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Order Confirmed!</h2>
          <p className="text-sm text-text-muted mb-2">
            Your order #{genId().slice(-8).toUpperCase()} has been placed successfully.
          </p>
          <p className="text-xs text-text-dim mb-6">
            A confirmation email will be sent to {checkoutForm.email || 'your email'}
          </p>
          <div className="card p-4 mb-6 text-left">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">Delivery Details</h3>
            <p className="text-sm text-foreground">{checkoutForm.name}</p>
            <p className="text-xs text-text-muted">{checkoutForm.address}</p>
            <p className="text-xs text-text-muted mt-2">Estimated delivery: 3-5 business days</p>
          </div>
          <button
            onClick={() => {
              setCurrentPage('catalog');
              setCheckoutForm({ name: '', email: '', address: '', card: '' });
              setOrderPlaced(false);
              eventRecorder.captureClick('Continue Shopping');
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ───────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col bg-background relative overflow-hidden">
      {/* Status bar */}
      <div className="px-5 py-2 bg-background/90 border-b border-border/20 flex items-center justify-between text-[10px] text-text-dim shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-recording animate-pulse-recording" />
          <span>ShopWave · Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Recording
          </span>
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {cartCount > 0 ? `${cartCount} in cart` : 'Browse'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentPage === 'catalog' && renderCatalog()}
        {currentPage === 'detail' && renderDetail()}
        {currentPage === 'cart' && renderCart()}
        {currentPage === 'checkout' && renderCheckout()}
        {currentPage === 'confirmation' && renderConfirmation()}
      </div>

      {/* Add global keyframes for confetti */}
      <style>{`
        @keyframes float-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.5); }
          30% { opacity: 1; transform: translateY(-10px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}