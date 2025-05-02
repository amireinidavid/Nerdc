"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Search } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-emerald-50 via-white to-white relative overflow-hidden">
      {/* Background pattern and decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20 z-0">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-emerald-800/[0.03] bg-[length:30px_30px]"></div>
      </div>

      <Container className="relative z-10">
        <section className="min-h-[90vh] flex flex-col justify-center items-center py-16 md:py-20 relative text-center">
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-sm font-medium text-emerald-800">
              Journal of Research and Educational Development
            </span>
          </motion.div>
          
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 max-w-5xl leading-tight tracking-tight"
          >
            Advancing Knowledge Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">Research and Education</span>
          </motion.h1>
          
          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10"
          >
            JORED is a platform for educators, researchers, and contributors to share, 
            discover, and access high-quality academic papers across disciplines.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12"
          >
            <Link href="/journals">
              <button className="px-8 py-3.5 min-w-[180px] bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/40 transition-all hover:scale-105">
                Browse Journals
              </button>
            </Link>
            <Link href="/my-journals">
              <button className="px-8 py-3.5 min-w-[180px] bg-white border-2 border-emerald-200 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-all">
                Submit Your Paper
              </button>
            </Link>
          </motion.div>
          
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative w-full max-w-3xl mx-auto mb-16"
          >
            <div className="relative flex items-center">
              <input 
                type="text"
                placeholder="Search by title, author, or keyword..."
                className="w-full py-4 pl-5 pr-12 bg-white border border-emerald-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
              />
              <button className="absolute right-3 p-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <button className="px-3 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 transition-all">
                Education
              </button>
              <button className="px-3 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 transition-all">
                Research Methods
              </button>
              <button className="px-3 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 transition-all">
                Curriculum Development
              </button>
            </div>
          </motion.div>
          
          {/* Credibility Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-full"
          >
            <div className="flex flex-col space-y-6">
              {/* Trust badges */}
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-4">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 text-xs">🔒</span>
                  </div>
                  <span className="text-emerald-800 text-xs sm:text-sm whitespace-nowrap">Peer-reviewed</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 text-xs">🏫</span>
                  </div>
                  <span className="text-emerald-800 text-xs sm:text-sm whitespace-nowrap">Trusted by Educators</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 text-xs">📈</span>
                  </div>
                  <span className="text-emerald-800 text-xs sm:text-sm whitespace-nowrap">Nationally Indexed</span>
                </div>
              </div>
              
              {/* Partner logos */}
              <div className="flex justify-center">
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 px-4 py-3 rounded-xl bg-white shadow-sm border border-emerald-100 max-w-3xl">
                  <span className="text-gray-500 text-xs sm:text-sm">Trusted by institutions across Nigeria</span>
                  <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-24 bg-emerald-50 rounded flex items-center justify-center">
                        <div className="text-emerald-700/50 text-xs">Partner Logo</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
{/*             
            Stats section
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-8 px-4 max-w-4xl mx-auto">
              <div className="bg-white shadow-sm border border-emerald-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">12K+</div>
                <div className="text-xs sm:text-sm text-gray-500">Research Papers</div>
              </div>
              <div className="bg-white shadow-sm border border-emerald-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">750+</div>
                <div className="text-xs sm:text-sm text-gray-500">Contributors</div>
              </div>
              <div className="bg-white shadow-sm border border-emerald-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">98%</div>
                <div className="text-xs sm:text-sm text-gray-500">Peer Reviewed</div>
              </div>
              <div className="bg-white shadow-sm border border-emerald-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">50+</div>
                <div className="text-xs sm:text-sm text-gray-500">Institutions</div>
              </div>
            </div> */}
          </motion.div>
        </section>
      </Container>
    </div>
  );
};

export default Hero;
