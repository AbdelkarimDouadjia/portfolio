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
            <span>
              <img
                src="/src/assets/text2.3d5aa6ba2d0632bb4e0572631c3f9dc2.svghttps://raw.githubusercontent.com/AbdelkarimDouadjia/portfolio/9c07f03c1459b93d6585c47b7831bc379336d62a/src/assets/text2.3d5aa6ba2d0632bb4e0572631c3f9dc2.svg"
                alt="text"
              />
            </span>
          </div>
          <div className="text-side">
            <h3>About me</h3>
            <h4>
              Front-end Developer <br /> based in Ain Defla, Algeria 📍
            </h4>
            <p>
              Hey, my name is Abdelkarim, and I&apos;m a Frontend Developer. My
              passion is to create and develop a clean UI/UX for my users.
              <br />
              <br />
              My main stack currently is React/Next.js in combination with
              Tailwind CSS and TypeScript.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
