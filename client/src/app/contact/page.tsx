"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Icons & UI Components
import { 
  Mail, Phone, MapPin, Clock, Send, Loader2,
  Facebook, Twitter, Linkedin, Instagram, Globe, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Form schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // Form submission handler
  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would normally send the form data to your backend
      console.log('Form submitted:', values);
      
      // Success message
      toast.success('Your message has been sent successfully!');
      
      // Reset form
      form.reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again later.');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <motion.div 
        className="container max-w-6xl py-12 mx-auto space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-3 py-1.5 bg-primary/10 border-primary/20 text-primary">
            Get in Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Contact Nigerian Educational Research and Development Council
          </h1>
          <p className="text-muted-foreground text-lg">
            Have questions or inquiries? We're here to help. Reach out to our team for assistance with educational resources, research, or curriculum development.
          </p>
        </motion.div>
        
        {/* Main Content Grid: 2/3 for form, 1/3 for contact info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form Column */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and our team will get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" className="border-white/10 bg-background/40" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email address" className="border-white/10 bg-background/40" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="What is your message about?" className="border-white/10 bg-background/40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please provide details about your inquiry..." 
                              className="min-h-[150px] resize-y border-white/10 bg-background/40"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* FAQ Section */}
            <motion.div variants={itemVariants} className="mt-8">
              <h2 className="text-2xl font-bold mb-6 text-primary">Frequently Asked Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How can I access NERDC educational materials?</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-black">
                      You can access our educational materials through our online portal, physical libraries, or by contacting our resource department directly.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How do I submit research for publication?</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-black">
                      Research submissions can be made through our online submission portal. Visit the Research section for guidelines.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Can NERDC provide training for educators?</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-black">
                      Yes, we offer various training programs and workshops for educators. Contact our training department for schedules.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">How can schools adopt NERDC curriculum?</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-black">
                      Schools interested in adopting our curriculum should contact the curriculum implementation department for guidance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Contact Information Column */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Contact Information</CardTitle>
                <CardDescription>
                  Multiple ways to reach us
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Address */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Headquarters</h3>
                    <p className="text-sm text-black">
                      NERDC Road, Sheda-Kwali<br />
                      P.M.B. 91<br />
                      Abuja, Nigeria
                    </p>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Phone</h3>
                    <p className="text-sm text-black">
                      Main: +234 (0) 8066582871<br />
                      Support: +234 (0) 8077017077
                    </p>
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <p className="text-sm text-black">
                      info@nerdc.gov.ng<br />
                      support@nerdc.gov.ng
                    </p>
                  </div>
                </div>
                
                {/* Hours */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Office Hours</h3>
                    <p className="text-sm text-black">
                      Monday - Friday: 8:00 AM - 5:00 PM<br />
                      Weekend: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Social Media */}
            <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Follow Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="border-white/10 bg-background/30 hover:bg-background/50 gap-2 justify-start">
                    <Facebook className="h-4 w-4 text-blue-500" />
                    Facebook
                  </Button>
                  <Button variant="outline" className="border-white/10 bg-background/30 hover:bg-background/50 gap-2 justify-start">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter
                  </Button>
                  <Button variant="outline" className="border-white/10 bg-background/30 hover:bg-background/50 gap-2 justify-start">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" className="border-white/10 bg-background/30 hover:bg-background/50 gap-2 justify-start">
                    <Instagram className="h-4 w-4 text-rose-500" />
                    Instagram
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Links */}
            <Card className="border-white/10 bg-background/40 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="link" className="w-full justify-start p-0 h-auto text-foreground hover:text-primary">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    About NERDC
                  </Button>
                  <Button variant="link" className="w-full justify-start p-0 h-auto text-foreground hover:text-primary">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Our Services
                  </Button>
                  <Button variant="link" className="w-full justify-start p-0 h-auto text-foreground hover:text-primary">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Research Publications
                  </Button>
                  <Button variant="link" className="w-full justify-start p-0 h-auto text-foreground hover:text-primary">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Educational Resources
                  </Button>
                  <Button variant="link" className="w-full justify-start p-0 h-auto text-foreground hover:text-primary">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Careers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Map Section */}
        <motion.div variants={itemVariants} className="mt-8 border border-white/10 rounded-xl overflow-hidden shadow-lg h-[400px] bg-background/20 relative">
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <Globe className="h-16 w-16 text-primary/20 mb-4" />
            <p className="text-muted-foreground text-center max-w-md px-4">
              Interactive map will be integrated here.<br />
              <span className="text-sm">For now, please use the address information to locate us.</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContactPage;
