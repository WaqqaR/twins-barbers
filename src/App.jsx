import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import shop from './config/shop.js';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Book from './pages/Book.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

function usePageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles = {
      '/': `${shop.name} — ${shop.tagline}`,
      '/book': `Book an appointment — ${shop.shortName}`,
      '/admin': `Admin — ${shop.shortName}`,
      '/admin/dashboard': `Dashboard — ${shop.shortName}`,
    };
    document.title = titles[pathname] || shop.name;
    // Scroll to top on route change (anchor links on the home page are handled separately).
    if (!pathname.includes('#')) window.scrollTo({ top: 0 });
  }, [pathname]);
}

export default function App() {
  usePageMeta();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<Book />} />
        <Route path="/booking/:id" element={<BookingConfirmation />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}
