'use client';

import React, { useEffect, useState } from 'react';
import styles from './Hero.module.css';

const Hero = () => {
    const [scrollY, setScrollY] = useState(0);
    const fadeStart = 10; 
    const fadeEnd = 250;  

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const opacity = Math.max(0, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
    const translateX = Math.min(500, (scrollY - fadeStart) / 2); 

    return (
        <section className={styles.hero}>
            <div 
                className={styles.content} 
                style={{
                    transform: `translateX(${translateX}px)`, // Slide right
                    transition: "transform 0.4s ease-out"
                }}
            >
                <h1>Your Personal Mental Health Companion</h1>
                <p>Experience 24/7 support, guided self-reflection, and personalized coping strategies with MindChat.</p>
                <button
                    className={styles.cta}
                    onClick={() => window.open("https://github.com/Swastik19Nit/Mind-Mate", "_blank")}
                >
                    Explore the Github Project
                </button>
            </div>
            <div 
                className={styles.imageWrapper} 
                style={{ 
                    transform: `translateY(${scrollY * 0.5}px)`, 
                    opacity,
                    transition: "opacity 0.4s ease-out, transform 0.4s ease-out"
                }}
            >
                <img src="/img.png" alt="MindChat Interface" className={styles.heroImage} />
            </div>
        </section>
    );
};

export default Hero;
