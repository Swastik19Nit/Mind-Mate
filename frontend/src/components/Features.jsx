import styles from "./Features.module.css"

const Features = () => {
  const features = [
    {
      title: "24/7 Support",
      description: "Access our AI chatbot anytime, anywhere for immediate mental health support.",
      icon: "🕒",
    },
    {
      title: "Personalized Strategies",
      description: "Receive tailored coping mechanisms based on your unique needs and experiences.",
      icon: "🎯",
    },
    {
      title: "Progress Tracking",
      description: "Monitor your mental health journey with insightful analytics and mood tracking.",
      icon: "📊",
    },
    {
      title: "Expert-Backed Content",
      description: "Benefit from resources and techniques developed by mental health professionals.",
      icon: "🧠",
    },
  ]

  return (
    <section id="features" className={styles.features}>
      <h2>Why Choose MindChat?</h2>
      <div className={styles.featureGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <div className={styles.icon}>{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features

