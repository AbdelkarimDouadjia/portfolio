import React from "react";
import projectArray from "../Projects/data.js";
import ProjectsCard from "./ProjectsCard.jsx";

const Projects = () => {
  return (
    <section id="projects" className="project">
      <div className="container">
        <h2 className="new-projects">
          <h4 className="text-3xl font-bold text-blue-500 mb-5 text-center md:text-left">
            PORTFOLIO
          </h4>
          <h3 className="text-5xl font-bold mb-8 text-center md:text-left">
            Check out my latest projects 🧩
          </h3>

          {projectArray.map((project, index) => (
            <ProjectsCard project={project} index={index} key={index} />
          ))}
        </h2>
      </div>
    </section>
  );
};

export default Projects;
