"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/container';

const features = [
  {
    id: 1,
    title: "Upload & Contribute to Our Research",
    description: "Easily upload your research papers and academic journals to our platform. Set your own pricing, track downloads.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    stat: "10K+",
    statLabel: "Papers Uploaded"
  },
  {
    id: 2,
    title: "Access Thousands of Peer-Reviewed Papers",
    description: "Gain instant access to our vast library of peer-reviewed academic papers across multiple disciplines, from medicine and technology to humanities and social sciences.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    stat: "50K+",
    statLabel: "Academic Papers"
  },
  {
    id: 3,
    title: "Secure Payment System",
    description: "Our platform features enterprise-grade security for all transactions. Multiple payment options, encrypted data, and transparent pricing ensure a safe and trustworthy experience.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    stat: "100%",
    statLabel: "Secure Transactions"
  },
  {
    id: 4,
    title: "Global Academic Community",
    description: "Join our worldwide community of researchers, professors, and students. Collaborate across borders, exchange knowledge, and stay connected with leading experts in your field.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    stat: "180+",
    statLabel: "Countries Represented"
  }
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-indigo-950/70">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-indigo-400 font-medium mb-2 px-3 py-1 bg-indigo-400/10 rounded-full text-sm">
              Our Platform Benefits
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              🧑‍💻 Why Use Our Platform?
            </h2>
            <p className="text-white/60 md:text-lg">
              Discover how our academic platform empowers researchers, educators, and students with cutting-edge tools and a global network.
            </p>
          </motion.div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-indigo-500/30 transition-colors group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60 mb-4">{feature.description}</p>
                  
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-indigo-400">{feature.stat}</span>
                    <span className="ml-2 text-white/40 text-sm">{feature.statLabel}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 py-4 px-6 rounded-2xl backdrop-blur-sm border border-indigo-500/20">
            <span className="text-white/70">Ready to transform your academic journey?</span>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
              Get Started Now
            </button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
