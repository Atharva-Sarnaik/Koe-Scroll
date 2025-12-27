import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import { ReaderProvider } from './context/ReaderContext';
import { LibraryProvider } from './context/LibraryContext';
const Reader = lazy(() => import('./features/Reader'));
const VoiceManager = lazy(() => import('./features/VoiceManager'));
const Home = lazy(() => import('./features/Home'));
const Library = lazy(() => import('./features/Library'));
const Settings = lazy(() => import('./features/Settings'));
const Profile = lazy(() => import('./features/Profile'));
const AddManga = lazy(() => import('./features/AddManga'));
const Discover = lazy(() => import('./features/Discover'));
const VoiceLab = lazy(() => import('./features/VoiceLab'));
const LandingPage = lazy(() => import('./features/LandingPage'));
const Login = lazy(() => import('./features/auth/Login'));
const SignUp = lazy(() => import('./features/auth/SignUp'));


function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <LibraryProvider>
        <ReaderProvider>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#6C63FF' }}>Loading...</div>}>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Protected App Routes */}
              <Route path="/app" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="library" element={<Library />} />
                <Route path="discover" element={<Discover />} />
                <Route path="voice-lab" element={<VoiceLab />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="add" element={<AddManga />} />
                {/* Note: Reader is still fullscreen but technically part of app flow, 
                   we can keep it nested or parallel. For now nested in App layout 
                   (which hides sidebar automatically) is fine. */}
                <Route path="reader/:id" element={<Reader />} />
                <Route path="reader/:id/voices" element={<VoiceManager />} />
              </Route>
            </Routes>
          </Suspense>
        </ReaderProvider>
      </LibraryProvider>
    </Router>
  );
}

export default App;
