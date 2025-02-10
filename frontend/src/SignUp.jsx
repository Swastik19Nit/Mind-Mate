import Carousel from "./components/Carousal";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";

const Signup = () => {
 
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <>
    <Header/>
      <Hero/>
      <Features/>
      <Carousel/>
      <Footer/>
    </>
  );
};

export default Signup;