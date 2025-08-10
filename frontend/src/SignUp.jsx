import Carousel from "./components/Carousal";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Header navigate={navigate} />
      <Hero />
      <Features />
      <Carousel />
      <Footer />
    </>
  );
};

export default Signup;