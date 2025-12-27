import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, MessageSquare, User, Sparkles, BookOpen, Mic, LogOut } from 'lucide-react';
import styles from './Layout.module.css';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const isReader = location.pathname.includes('/reader');

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // Get user display info from Google OAuth metadata
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const userEmail = user?.email;

    if (isReader) {
        return <Outlet />;
    }

    return (
        <div className={styles.appLayout}>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
                {/* Logo */}
                <div className={styles.logoWrapper}>
                    <div className={styles.logoIcon}>
                        <Sparkles size={18} color="#000" />
                    </div>
                    <h1 className={styles.logoText}>KoeScroll</h1>
                </div>

                <nav className={styles.nav}>
                    <SidebarLink to="/app" icon={<Home size={20} />} label="Home" />
                    <SidebarLink to="/app/library" icon={<BookOpen size={20} />} label="Metashelf" />
                    <SidebarLink to="/app/discover" icon={<Compass size={20} />} label="Discover" />
                    <SidebarLink to="/app/voice-lab" icon={<Mic size={20} />} label="Voice Lab" />
                    <SidebarLink to="/app/add" icon={<Sparkles size={20} />} label="Import" />
                    <div style={{ opacity: 0.5, marginTop: 'auto' }}>
                        <SidebarLink to="#" icon={<MessageSquare size={20} />} label="Community" disabled />
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className={styles.mainContent}>

                {/* Top Header */}
                <header className={styles.header}>
                    <div style={{ marginRight: '16px' }}>
                        <ThemeToggle />
                    </div>

                    {/* User Profile Button */}
                    <div className={styles.headerUser}>
                        <button
                            onClick={() => navigate('/app/profile')}
                            className={styles.profileButton}
                        >
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    className={styles.avatarImg}
                                />
                            ) : (
                                <div className={styles.avatar}>
                                    <User size={16} color="#fff" />
                                </div>
                            )}
                            <div className={styles.profileInfo}>
                                <span className={styles.profileName}>{userName}</span>
                                {userEmail && (
                                    <span className={styles.profileEmail}>{userEmail}</span>
                                )}
                            </div>
                        </button>

                        {/* Sign Out Button */}
                        {user && (
                            <button
                                onClick={handleSignOut}
                                className={styles.signOutBtn}
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.pageContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string, disabled?: boolean }> = ({ to, icon, label, disabled }) => {
    if (disabled) {
        return (
            <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>
                {icon}
                <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
        );
    }

    return (
        <NavLink
            to={to}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
            end={to === '/app'} // Only exact match for Home
        >
            {({ isActive }) => (
                <>
                    {React.cloneElement(icon as React.ReactElement<any>, { color: isActive ? '#000' : 'currentColor' })}
                    <span style={{ fontWeight: isActive ? 600 : 500 }}>{label}</span>
                </>
            )}
        </NavLink>
    );
};

export default Layout;
