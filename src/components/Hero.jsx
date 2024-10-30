import React from "react";

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container mx-auto	 !max-w-[107rem] py-0 min-[460px]:px-16 px-[1.7rem] ">
        <div className="content flex items-center gap-12 h-auto min-[900px]:gap-[10px] min-[900px]:h-[65rem] justify-center relative  flex-col  text-center  ">
          <div className="hero-main flex items-center flex-col-reverse h-auto gap-12 min-[900px]:gap-40 text-center justify-center relative min-[900px]:flex-row min-[900px]:text-left">
            <div className="hero-text flex flex-col max-w-[50rem] relative">
              <h1 className="text-[#2d2e32] text-[4rem] min-[500px]:text-[5.5rem] leading-[1.2] my-8 font-bold">
                Front-End React Developer
              </h1>
              <img
                className="absolute right-[1.7rem] min-[375px]:right-[3rem]  h-[4.5rem] top-[6.4rem] w-[4.5rem]  min-[400px]:right-[4rem] min-[500px]:right-[3rem] min-[900px]:h-24 min-[900px]:w-24 min-[900px]:!top-[8.7rem] min-[900px]:!right-[13rem]"
                src="https://github.com/AbdelkarimDouadjia/portfolio/blob/main/src/assets/waving.1bae5fcfb51082b5c2b4.png?raw=true"
                alt="waving_hand"
              />
              <p className="text-[#555] text-[1.8rem] font-medium leading-[1.6] mb-20 min-[900px]:mb-0 font-mulish">
                Hi, I&apos;m Abdelkarim Douadjia. A passionate Front-end React
                Developer based in Ain Defla, Algeria. 📍
              </p>
              <span className="flex cursor-pointer gap-[1.6rem] justify-center mb-16 -mt-8 min-[900px]:my-[2.5rem] min-[900px]:mx-0 min-[900px]:justify-start">
                <a
                  aria-label="linkedin"
                  rel="noreferrer"
                  target="_blank"
                  href="https://www.linkedin.com/in/abdelkarimdouadjia/"
                  className="text-[#2d2e32] text-[3rem] transition-all duration-300 hover:text-[#147efb]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tabler-icon tabler-icon-brand-linkedin"
                  >
                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                    <path d="M8 11l0 5"></path>
                    <path d="M8 8l0 .01"></path>
                    <path d="M12 16l0 -5"></path>
                    <path d="M16 16v-3a2 2 0 0 0 -4 0"></path>
                  </svg>
                </a>
                <a
                  aria-label="github"
                  rel="noreferrer"
                  target="_blank"
                  href="https://github.com/AbdelkarimDouadjia"
                  className="text-[#2d2e32] text-[3rem] transition-all duration-300 hover:text-[#147efb]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tabler-icon tabler-icon-brand-github"
                  >
                    <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path>
                  </svg>
                </a>

                {/* Download Resumé Icon */}
                <a
                  href="/Abdelkarim-Douadjia-CV-Resume.pdf" // Replace with your resume
                  download
                  aria-label="Download CV"
                  className="text-[#2d2e32] text-[3rem] transition-all duration-300 hover:text-[#147efb]"
                  title="Download CV"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tabler-icon tabler-icon-file-text"
                  >
                    <path d="M14 2l-10 0a2 2 0 0 0 -2 2l0 16a2 2 0 0 0 2 2l12 0a2 2 0 0 0 2 -2l0 -14l-6 -4z"></path>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                    <path d="M12 18h-6"></path>
                    <path d="M12 14h-6"></path>
                    <path d="M12 10h-6"></path>
                  </svg>
                </a>
              </span>
            </div>
            <div className="hero-img"></div>
          </div>
          <div className="skills flex !items-center text-[#767676] left-0 bottom-0 text-[1.7rem] flex-col static min-[900px]:flex-row min-[900px]:absolute  ">
            <p className="text-[#2d2e32] font-mulish font-extrabold border-r-0 mb-12 pb-4 pr-0 border-b-2 border-b-[#2d2e3280]  min-[900px]:mr-28 min-[900px]:pr-8  min-[900px]:border-r-2 min-[900px]:border-[#2d2e3280] min-[900px]:border-b-0 min-[900px]:mb-0 min-[900px]:pb-0 ">
              Tech Stack
            </p>
            <div className="logos">
              <ul className="flex flex-wrap items-center gap-12 list-none justify-center min-[900px]:justify-start">
                <li className="cursor-pointer ">
                  <img
                    className="h-20 transition-all duration-300 w-44 hover:-translate-y-4 "
                    src="https://skillicons.dev/icons?i=html,css"
                    alt="skill-icon"
                    preload="true"
                  />
                </li>
                <li className="cursor-pointer ">
                  <img
                    className="h-20 transition-all duration-300 w-44 hover:-translate-y-4 "
                    src="https://skillicons.dev/icons?i=js,ts"
                    alt="skill-icon"
                  />
                </li>
                <li className="cursor-pointer ">
                  <img
                    className="h-20 transition-all duration-300 w-44 hover:-translate-y-4 "
                    src="https://skillicons.dev/icons?i=react,next"
                    alt="skill-icon"
                  />
                </li>
                <li className="cursor-pointer ">
                  <img
                    className="h-20 transition-all duration-300 w-44 hover:-translate-y-4 "
                    src="https://skillicons.dev/icons?i=tailwind,scss"
                    alt="skill-icon"
                  />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
