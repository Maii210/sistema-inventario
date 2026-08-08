import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { Hero } from './components/Home/Hero';
import { FeaturedProducts } from './components/Home/FeaturedProducts';
import { Features } from './components/Home/Features';
import { ProductGrid } from './components/Catalog/ProductGrid';
import { ProductDetail } from './components/Product/ProductDetail';
import { Cart } from './components/Cart/Cart';
import { Checkout } from './components/Cart/Checkout';
import { FragranceQuiz } from './components/Quiz/FragranceQuiz';
import { ProductComparator } from './components/Comparator/ProductComparator';
import { FragranceGuide } from './components/Guide/FragranceGuide';
import { Chatbot } from './components/Chatbot/Chatbot';
import { Login } from './components/Auth/Login';
import { GiftMode } from './components/Gift/GiftMode';
import { ReviewsSection } from './components/Reviews/ReviewsSection';
import { AdminPanel } from './components/Admin/AdminPanel';

function AppContent() {
  const { state } = useApp();

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'home':
        return (
          <>
            <Hero />
            <FeaturedProducts />
            <Features />
          </>
        );
      case 'catalog':
        return <ProductGrid />;
      case 'product':
        return <ProductDetail />;
      case 'cart':
        return <Cart />;
      case 'checkout':
        return <Checkout />;
      case 'quiz':
        return <FragranceQuiz />;
      case 'comparator':
        return <ProductComparator />;
      case 'guide':
        return <FragranceGuide />;
      case 'login':
        return <Login />;
      case 'gift':
        return <GiftMode />;
      case 'reviews':
        return <ReviewsSection />;
      case 'admin':
        return <AdminPanel />;
      default:
        return (
          <>
            <Hero />
            <FeaturedProducts />
            <Features />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      <Header />
      <main>
        {renderCurrentView()}
      </main>
      {!['quiz', 'comparator', 'guide', 'login', 'gift', 'reviews', 'admin'].includes(state.currentView) && <Footer />}
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;