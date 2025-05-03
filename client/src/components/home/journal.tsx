"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/container';
import useJournalStore from '@/store/useJournalStore';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const JournalSection = () => {
  const { journals, fetchPublishedJournals, isLoading } = useJournalStore();
  const [selectedJournals, setSelectedJournals] = useState<any[]>([]);
  const [featuredJournal, setFeaturedJournal] = useState<any>(null);
  console.log(fetchPublishedJournals);
  useEffect(() => {
    // Fetch published journals on mount
    fetchPublishedJournals(1, 20);
  }, [fetchPublishedJournals]);
  
  useEffect(() => {
    if (journals.length > 0) {
      // Get a random set of journals (between 5-8)
      const journalCount = Math.min(journals.length, Math.floor(Math.random() * 4) + 5);
      const shuffled = [...journals].sort(() => 0.5 - Math.random());
      
      // Select one featured journal
      const featured = shuffled[0];
      setFeaturedJournal(featured);
      
      // Select remaining journals for the grid
      const remaining = shuffled.slice(1, journalCount);
      setSelectedJournals(remaining);
    }
  }, [journals]);
  
  if (isLoading && journals.length === 0) {
    return (
      <section className="py-16 bg-white">
        <Container>
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-gray-500">Loading journals...</p>
          </div>
        </Container>
      </section>
    );
  }
  
  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                📚 Some of our Journal/Research
              </motion.h2>
              <motion.p 
                className="text-gray-600 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Discover groundbreaking research from leading academics and institutions across Nigeria
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/journals">
                <button className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700">
                  View All
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Featured Journal */}
        {featuredJournal && (
          <motion.div 
            className="mb-16 bg-gradient-to-br from-emerald-50 to-white rounded-2xl overflow-hidden border border-emerald-100 shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold mb-5">
                    Featured Journal
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{featuredJournal.title}</h3>
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {featuredJournal.author?.name ? featuredJournal.author.name.charAt(0) : 'A'}
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-800 font-medium">{featuredJournal.author?.name || "Anonymous"}</p>
                      <p className="text-gray-500 text-sm">{featuredJournal.author?.institution || "Institution"}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 line-clamp-4">{featuredJournal.abstract}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6">
                  <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
                    {featuredJournal.tags?.slice(0, 3).map((tagItem: any, index: number) => (
                      <span key={tagItem.tag.id} className="text-xs text-emerald-700 px-2 py-1 bg-emerald-50 rounded-md">
                        {tagItem.tag.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="text-emerald-600">{featuredJournal.viewCount || 0} views</span>
                    <span>•</span>
                    <span>{new Date(featuredJournal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Link href={`/journals/${featuredJournal.id}`}>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                      View Details
                    </button>
                  </Link>
                  {featuredJournal.price ? (
                    <button className="px-5 py-2.5 border border-emerald-200 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center">
                      <span>Add to Cart</span>
                      <span className="ml-2 text-gray-500">${featuredJournal.price}</span>
                    </button>
                  ) : (
                    <Link href={`/journals/${featuredJournal.id}`}>
                      <button className="px-5 py-2.5 border border-emerald-200 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center">
                        <span>Read Free</span>
                      </button>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="relative h-64 md:h-auto">
                <Image
                  src={featuredJournal.thumbnailUrl || "https://images.unsplash.com/photo-1576671081744-f22e37ae21a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"} 
                  alt={featuredJournal.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  width={800}
                  height={800}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-emerald-500/30"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-emerald-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Journal Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedJournals.map((journal, index) => (
            <motion.div
              key={journal.id}
              className="bg-white rounded-xl overflow-hidden border border-emerald-100 shadow-sm h-full flex flex-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="h-40 relative">
                <Image
                  src={journal.thumbnailUrl || "https://images.unsplash.com/photo-1576671081744-f22e37ae21a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"} 
                  alt={journal.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  width={800}
                  height={800}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 z-10"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute bottom-0 left-0 p-4 z-20">
                  <div className="flex space-x-2 mb-2">
                    {journal.tags?.slice(0, 2).map((tagItem: any) => (
                      <span key={tagItem.tag.id} className="text-xs text-white px-2 py-0.5 bg-emerald-500/30 backdrop-blur-sm rounded-md">
                        {tagItem.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{journal.title}</h3>
                
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                    {journal.author?.name ? journal.author.name.charAt(0) : 'A'}
                  </div>
                  <div className="ml-2">
                    <p className="text-gray-800 text-sm font-medium">{journal.author?.name || "Anonymous"}</p>
                    <p className="text-gray-500 text-xs">{journal.author?.institution || "Institution"}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{journal.abstract}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{new Date(journal.createdAt).toLocaleDateString()}</span>
                  <span>{journal.viewCount || 0} views</span>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link href={`/journals/${journal.id}`} className="flex-1">
                    <button className="w-full px-3 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm">
                      View Details
                    </button>
                  </Link>
                  {journal.price ? (
                    <button className="px-3 py-2 border border-emerald-200 text-gray-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      ${journal.price}
                    </button>
                  ) : (
                    <Link href={`/journals/${journal.id}`}>
                      <button className="px-3 py-2 border border-emerald-200 text-gray-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors text-sm">
                        Free
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* View All Button */}
        <div className="mt-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/journals">
              <button className="px-6 py-3 border border-emerald-200 text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors">
                View All Journals
              </button>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default JournalSection;
