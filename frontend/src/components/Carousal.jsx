"use client"

import { useState } from "react"
import styles from "./Carousel.module.css"

const Carousel = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const testimonials = [
    {
      quote:
        "MindChat has been a game-changer for my mental health. It's like having a supportive friend available 24/7.",
      author: "Sarah K.",
    },
    {
      quote: "The personalized strategies have helped me cope with anxiety in ways I never thought possible.",
      author: "Michael R.",
    },
    {
      quote:
        "As a therapist, I recommend MindChat to my clients for additional support between sessions. It's an invaluable tool.",
      author: "Dr. Emily Chen",
    },
  ]

  const nextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="testimonials" className={styles.carousel}>
      <h2>What Our Users Say</h2>
      <div className={styles.carouselContainer}>
        {testimonials.map((testimonial, index) => (
          <div key={index} className={`${styles.carouselItem} ${index === activeIndex ? styles.active : ""}`}>
            <p className={styles.quote}>"{testimonial.quote}"</p>
            <p className={styles.author}>- {testimonial.author}</p>
          </div>
        ))}
      </div>
      <div className={styles.carouselControls}>
        <button onClick={prevSlide}>&lt;</button>
        <button onClick={nextSlide}>&gt;</button>
      </div>
    </section>
  )
}

export default Carousel

