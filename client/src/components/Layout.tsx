import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { CopilotFloatingTrigger } from './copilot/CopilotFloatingTrigger';
import { CopilotDrawer } from './copilot/CopilotDrawer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen md:h-screen md:max-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden md:overflow-hidden">
      {/* 1. Desktop Stationary Left Sidebar */}
      <Sidebar />

      {/* 2. Right-Hand Content Area with Independent Scroll */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:min-h-0 md:h-screen md:max-h-screen md:overflow-hidden">
        <Navbar />
        
        {/* Dedicated Independent Scroll Container for Desktop Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-6 overflow-y-auto overflow-x-hidden min-h-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>

        <Footer className="hidden md:block shrink-0" />
      </div>

      {/* 3. Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* 4. AI Copilot Global Components */}
      <CopilotFloatingTrigger />
      <CopilotDrawer />
    </div>
  );
};
