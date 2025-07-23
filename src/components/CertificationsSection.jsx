import React from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const certifications = [
  {
    title: "Databricks Lakehouse Fundamentals",
    provider: "Databricks",
    date: "Feb 2024",
    link: "#",
  },
  {
    title: "Complete dbt (Data Build Tool) Bootcamp",
    provider: "Udemy",
    date: "Nov 2023",
    link: "#",
  },
  {
    title: "Microsoft Azure Fundamentals (AZ-900)",
    provider: "Microsoft",
    date: "May 2023",
    link: "#",
  },
  {
    title: "Machine Learning Specialization",
    provider: "Deeplearning.AI",
    date: "Dec 2023",
    link: "#",
  },
  {
    title: "Mathematics for Machine Learning & Data Science",
    provider: "Deeplearning.AI",
    date: "Dec 2023",
    link: "#",
  },
  {
    title: "Python, Bash and SQL Essentials for Data Engineering",
    provider: "Duke University",
    date: "Apr 2023",
    link: "#",
  },
];

const CertificationCard = ({ title, provider, date, link }) => (
  <div className="bg-[#27293d] p-6 rounded-lg shadow-md transform transition-transform hover:scale-105">
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400">{provider}</p>
    <p className="text-sm text-gray-500 mb-4">{date}</p>
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-[#ffdd57] hover:underline"
    >
      View credential <FaExternalLinkAlt className="ml-2" />
    </a>
  </div>
);

const CertificationsSection = () => (
  <section className="bg-gray-50 py-10">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Courses & Certifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900">
            Responsive Web Design
          </h3>
          <p className="text-sm text-gray-500">freeCodeCamp</p>
          <p className="text-gray-700 mt-4">
            Skills: HTML5, CSS3, Animation CSS
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900">
            Front-End Engineer Career Path
          </h3>
          <p className="text-sm text-gray-500">Codecademy</p>
          <p className="text-gray-700 mt-4">
            Skills: React, GitHub, Algorithms, Redux
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900">
            Meta Front-End Developer
          </h3>
          <p className="text-sm text-gray-500">Meta Professional Certificate</p>
          <p className="text-gray-700 mt-4">
            Skills: UI/UX, REST APIs, JavaScript
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default CertificationsSection;
