import { useEffect, useRef, useState } from 'react';
import { useMediaQuery, useDarkTheme } from './hooks';

// Import the same SVG assets from the original component
import DocsGPT3 from './assets/astroLogo.svg';
import Expand from './assets/expand.svg';
import Add from './assets/add.svg';
import SettingGear from './assets/settingGear.svg';
import Hamburger from './assets/hamburger.svg';

interface NavigationProps {
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MinimalNavigation({ navOpen, setNavOpen }: NavigationProps) {
  const { isMobile, isTablet } = useMediaQuery();
  const [isDarkTheme] = useDarkTheme();
  
  const navRef = useRef<HTMLDivElement>(null);

  // Handle outside click for mobile/tablet
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        (isMobile || isTablet) &&
        navOpen
      ) {
        setNavOpen(false);
      }
    }

    if ((isMobile || isTablet) && navOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [navOpen, isMobile, isTablet, setNavOpen]);

  // Auto-close nav on mobile/tablet
  useEffect(() => {
    setNavOpen(!(isMobile || isTablet));
  }, [isMobile, isTablet]);

  return (
    <>
      {/* Top bar when nav is closed (desktop only) */}
      {!navOpen && (
        <div className="absolute top-3 left-3 z-20 hidden transition-all duration-25 lg:block">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen(!navOpen)}
            >
              <img
                src={Expand}
                alt="Toggle navigation menu"
                className={`${
                  !navOpen ? 'rotate-180' : 'rotate-0'
                } m-auto transition-all duration-200`}
              />
            </button>
            <div className="text-gray-4000 text-[20px] font-medium">
              AstroGPT
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Sidebar */}
      <div
        ref={navRef}
        className={`${
          !navOpen && '-ml-96 md:-ml-72'
        } bg-lotion dark:border-r-purple-taupe dark:bg-chinese-black fixed top-0 z-20 flex h-full w-72 flex-col border-r border-b-0 transition-all duration-20 dark:text-white`}
      >
        {/* Header */}
        <div className="visible mt-2 flex h-[6vh] w-full justify-between md:h-12">
          <div className="mx-4 my-auto flex cursor-pointer gap-1.5">
            <a href="/" className="flex gap-1.5">
              <img className="mb-2 h-10" src={DocsGPT3} alt="DocsGPT Logo" />
              <p className="my-auto text-2xl font-semibold">AstroGPT</p>
            </a>
          </div>
          <button
            className="float-right mr-5"
            onClick={() => setNavOpen(!navOpen)}
          >
            <img
              src={Expand}
              alt="Toggle navigation menu"
              className={`${
                !navOpen ? 'rotate-180' : 'rotate-0'
              } m-auto transition-all duration-200`}
            />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="mx-4 mt-4">
          <button className="group border-silver hover:border-rainy-gray dark:border-purple-taupe w-full flex cursor-pointer gap-2.5 rounded-3xl border p-3 hover:bg-transparent dark:text-white">
            <img
              src={Add}
              alt="Create new chat"
              className="opacity-80 group-hover:opacity-100"
            />
            <p className="text-dove-gray dark:text-chinese-silver dark:group-hover:text-bright-gray text-sm group-hover:text-neutral-600">
              New Chat
            </p>
          </button>
        </div>

        {/* Content Area - Empty for now */}
        <div className="mb-auto h-[78vh] overflow-x-hidden overflow-y-auto dark:text-white">
          <div className="mx-4 mt-8 text-center text-gray-500 dark:text-gray-400">
            <p>TTTTa3mlo kachtaAAAA</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-eerie-black flex h-auto flex-col justify-end dark:text-white">
          <div className="dark:border-b-purple-taupe flex flex-col gap-2 border-b py-2">
            <button className="mx-4 my-auto flex h-9 cursor-pointer items-center gap-4 rounded-3xl hover:bg-gray-100 dark:hover:bg-[#28292E]">
              <img
                src={SettingGear}
                alt="Settings"
                width={21}
                height={21}
                className="my-auto ml-2 filter dark:invert"
              />
              <p className="text-eerie-black text-sm dark:text-white">
                Settings
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="dark:border-b-purple-taupe dark:bg-chinese-black sticky z-10 h-16 w-full border-b-2 bg-gray-50 lg:hidden">
        <div className="ml-6 flex h-full items-center gap-6">
          <button
            className="h-6 w-6 lg:hidden"
            onClick={() => setNavOpen(true)}
          >
            <img
              src={Hamburger}
              alt="Toggle mobile menu"
              className="w-7 filter dark:invert"
            />
          </button>
          <div className="text-gray-4000 text-[20px] font-medium">AstroGPT</div>
        </div>
      </div>
    </>
  );
}