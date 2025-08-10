import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Header = ({ navigate }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check authentication status when component mounts
        fetch(`${apiUrl}/auth/check`, {
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                setIsAuthenticated(true);
                if (navigate) {
                    navigate('/app');
                }
            }
        })
        .catch(err => console.error('Auth check error:', err));
    }, [navigate]);

    const handleGoogleLogin = (e) => {
        e.preventDefault();
        // Store the intended destination
        localStorage.setItem('redirectAfterLogin', '/app');
        window.location.href = `${apiUrl}/auth/google`;
    };

    return (
        <header className={styles.header}>
            <div className={styles.logo}>MindMate</div>
            <nav>
                <ul className={styles.navList}>
                    <li className="mt-2"><a href="#features">Features</a></li>
                    <li className="mt-2"><a href="#testimonials">Testimonials</a></li>
                    <li>
                        <button
                            onClick={handleGoogleLogin}
                            className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Sign in with Google
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;
