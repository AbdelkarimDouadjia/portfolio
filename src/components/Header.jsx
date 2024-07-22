import React, { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header fixed top-0 left-0 w-full p-6 text-[1.7rem] bg-white shadow-md z-50">
      <div className="container !px-[15px] mx-auto flex justify-between items-center">
        <h3 className="!text-[2rem] font-bold text-[#2d2e32] cursor-pointer">
          <a href="#">Abdelkarim.dev</a>
        </h3>
        <nav className="flex space-x-6">
          <ul className="hidden md:flex space-x-6">
            <li>
              <a
                href="#home"
                className="text-[#2d2e32] hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[17px] font-semibold relative z-[2]"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="text-[#2d2e32] hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[17px] font-semibold relative z-[2]"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#projects"
                className="text-[#2d2e32] hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[17px] font-semibold relative z-[2]"
              >
                Projects
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="text-[#2d2e32] hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[17px] font-semibold relative z-[2]"
              >
                Contact
              </a>
            </li>
          </ul>

          <button
            className="md:hidden nav-open-btn burger-icon hover:text-[#147efb]"
            aria-label="open menu"
            onClick={toggleMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mobile-menu"
            >
              <path d="M4 6l16 0"></path>
              <path d="M4 12l16 0"></path>
              <path d="M4 18l16 0"></path>
            </svg>
          </button>
        </nav>
      </div>

      <div
        className={`md:hidden fixed inset-0 bg-white z-40 flex flex-col items-center justify-center text-[1.7rem] transition-transform duration-500 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-8 right-16 text-[3.3rem] hover:text-[#147efb]"
          onClick={toggleMenu}
          aria-label="close menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="tabler-icon tabler-icon-x"
          >
            <path d="M18 6l-12 12"></path>
            <path d="M6 6l12 12"></path>
          </svg>
        </button>
        <ul className="space-y-16 text-center">
          <li>
            <a
              href="#home"
              className="text-black hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[23px] font-medium"
              onClick={toggleMenu}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#about"
              className="text-black hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[23px] font-medium"
              onClick={toggleMenu}
            >
              About
            </a>
          </li>
          <li>
            <a
              href="#projects"
              className="text-black hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[23px] font-medium"
              onClick={toggleMenu}
            >
              Projects
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className="text-black hover:text-[#147efb] py-[5px] px-[10px] transition-all duration-300 text-[23px] font-medium"
              onClick={toggleMenu}
            >
              Contact
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
