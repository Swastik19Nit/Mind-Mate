import styles from "./Footer.module.css"

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.logo}>MindChat</div>
        <nav className={styles.footerNav}>
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
        </nav>
        <div className={styles.social}>
          <a href="#" aria-label="Facebook">
            FB
          </a>
          <a href="#" aria-label="Twitter">
            TW
          </a>
          <a href="#" aria-label="Instagram">
            IG
          </a>
        </div>
      </div>
      <div className={styles.copyright}>Made by Swastik </div>
    </footer>
  )
}

export default Footer

