import React from "react";

const About = () => {
  return (
    <section className="about" id="about">
      <div className="container mx-auto	 !max-w-[107rem] py-0 min-[460px]:px-16 px-[1.7rem] ">
        <div className="about-content ">
          <div className="img-side relative">
            <img
              src="https://github.com/AbdelkarimDouadjia/portfolio/blob/main/src/assets/working-emoji.c5325f52b5be329995a5.png?raw=true"
              alt="emoji"
              className="work-emoji "
            />
            <img
              src="https://raw.githubusercontent.com/AbdelkarimDouadjia/portfolio/main/src/assets/about-img.62b47e7f183d4b4e9feb.webp"
              alt="mee"
              className="img-side__main-img mx-auto"
            />
            <span className="flex items-center justify-center text-center">
              <svg
                width="190"
                height="190"
                viewBox="0 0 190 190"
                className="animate-spin"
                style={{ animationDuration: "9s" }}
              >
                <defs>
                  <path
                    id="circlePath"
                    d="M 95, 95 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                  />
                  <linearGradient
                    id="textGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style={{ stopColor: "#147efb", stopOpacity: 1 }}
                    />
                    <stop
                      offset="50%"
                      style={{ stopColor: "#2d2e32", stopOpacity: 1 }}
                    />
                    <stop
                      offset="100%"
                      style={{ stopColor: "#147efb", stopOpacity: 1 }}
                    />
                  </linearGradient>
                </defs>
                <text
                  fill="url(#textGradient)"
                  fontSize="16"
                  fontWeight="600"
                  fontFamily="Poppins, sans-serif"
                  letterSpacing="1.5"
                >
                  <textPath href="#circlePath" startOffset="0%">
                    🤖 Machine Learning Engineer • ✨ AI Specialist • 🚀 Data
                    Scientist •
                  </textPath>
                </text>
              </svg>
            </span>
          </div>
          <div className="text-side">
            <h3>About me</h3>
            <h4>
              Machine Learning Engineer <br /> based in Paris, France 📍
            </h4>
            <p>
              Hey, my name is Abdelkarim, and I&apos;m a Machine Learning
              Engineer. My passion is to build and deploy intelligent AI
              solutions that solve real-world problems.
              <br />
              <br />
              Currently pursuing Master&apos;s in AI - AMIS (Algorithmiques et
              Modélisation à l&apos;Interface des Sciences) at University of
              Paris-Saclay. My main stack includes Python, PyTorch, TensorFlow,
              and scikit-learn for machine learning, along with Docker and
              Kubernetes for deployment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
