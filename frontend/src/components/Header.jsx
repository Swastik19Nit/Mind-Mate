import React from 'react';
import styles from './Header.module.css';

const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
};

const Header = () => {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>MindChat</div>
            <nav>
                <ul className={styles.navList}>
                    <li className='mt-2'><a href="#features">Features</a></li>
                    <li className='mt-2'><a href="#testimonials">Testimonials</a></li>
                    
                        <button
                            onClick={handleGoogleLogin}
                            className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Sign in with Google
                        </button>
                    
                </ul>
            </nav>
        </header>
    );
};

export default Header;
