"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Upload, X, FileText, Image as ImageIcon, Info, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

// Store
import useJournalStore from '@/store/useJournalStore';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(255, { message: 'Title must be less than 255 characters' }),
  abstract: z.string()
    .min(50, { message: 'Abstract must be at least 50 characters' })
    .max(2000, { message: 'Abstract must be less than 2000 characters' }),
  content: z.string().optional(),
  categoryId: z.string().min(1, { message: 'You must select a category' }),
  publicationDate: z.date({
    required_error: "Publication date is required",
  }),
  doi: z.string().regex(/^10\.\d{4,9}\/[-._;()\/:A-Za-z0-9]+$/, { 
    message: 'DOI must be in a valid format (e.g., 10.1234/abc123)' 
  }).optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const CreateJournalPage = () => {
  const router = useRouter();
  const { createJournal, isSubmitting, error, clearErrors } = useJournalStore();
  
  // File state management
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  
  // Categories state
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Education and Pedagogy' },
    { id: 2, name: 'Science and Technology' },
    { id: 3, name: 'Health and Medical Sciences' },
    { id: 4, name: 'Agricultural Sciences' },
    { id: 5, name: 'Environmental Studies' },
    { id: 6, name: 'Social Sciences' },
    { id: 7, name: 'Humanities and Arts' },
    { id: 8, name: 'Engineering and Applied Sciences' },
    { id: 9, name: 'ICT and Digital Innovation' },
    { id: 10, name: 'Business, Management & Finance' },
    { id: 11, name: 'Law and Policy Studies' },
    { id: 12, name: 'Vocational and Technical Education' },
    { id: 13, name: 'Teacher Education and Curriculum Studies' },
    { id: 14, name: 'Library and Information Science' },
    { id: 15, name: 'Peace, Conflict, and Security Studies' },
  ]);
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Basic Education' },
    { id: 2, name: 'Tertiary Education' },
    { id: 3, name: 'Curriculum Development' },
    { id: 4, name: 'Inclusive Education' },
    { id: 5, name: 'WAEC/NECO-focused Research' },
    { id: 6, name: 'Student Performance' },
    { id: 7, name: 'Online Learning' },
    { id: 8, name: 'E-learning' },
    { id: 9, name: 'Teacher Training' },
    { id: 10, name: 'Education Policy' },
    { id: 11, name: 'Private vs. Public School Analysis' },
    { id: 12, name: 'Sustainable Development Goals' },
    { id: 13, name: 'Nigerian Educational System' },
    { id: 14, name: 'NYSC Research' },
    { id: 15, name: 'Rural Education in Nigeria' },
    { id: 16, name: 'Northern Nigeria Studies' },
    { id: 17, name: 'Nigerian Languages in Education' },
    { id: 18, name: 'JAMB Research' },
    { id: 19, name: 'Education for Almajiri Children' },
    { id: 20, name: 'Indigenous Knowledge Systems' },
    { id: 21, name: 'Gender and Education in Nigeria' },
    { id: 22, name: 'National Policy on Education' },
    { id: 23, name: 'UNESCO Compliance' },
    { id: 24, name: 'NUC-Approved Research' },
    { id: 25, name: 'Education Financing' },
    { id: 26, name: 'Teaching Quality Metrics' },
    { id: 27, name: 'Government Reforms in Education' },
    { id: 28, name: 'Quantitative Study' },
    { id: 29, name: 'Qualitative Analysis' },
    { id: 30, name: 'Mixed Methods' },
    { id: 31, name: 'Case Study' },
    { id: 32, name: 'Survey Research' },
    { id: 33, name: 'Comparative Education' },
    { id: 34, name: 'Data-driven Evaluation' },
    { id: 35, name: 'Peer Review Pending' },
    { id: 36, name: 'Published 2024' },
  ]);
  
  const [selectedTags, setSelectedTags] = useState<{ id: number; name: string }[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  
  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      abstract: '',
      content: '',
      categoryId: '',
      publicationDate: new Date(),
      doi: '',
      tags: [],
    },
  });
  
  // Clear any previous errors
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);
  
  // Handle PDF file upload
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPdfError(null);
    
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files are allowed');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('File size must be less than 10MB');
      return;
    }
    
    setPdfFile(file);
  };
  
  // Handle thumbnail file upload
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setThumbnailError(null);
    
    if (!file) return;
    
    // Validate file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!imageTypes.includes(file.type)) {
      setThumbnailError('Only JPEG, PNG, and WebP files are allowed');
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setThumbnailError('File size must be less than 2MB');
      return;
    }
    
    setThumbnailFile(file);
  };
  
  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    const tag = availableTags.find(t => t.id.toString() === tagId);
    if (tag && !selectedTags.some(t => t.id === tag.id)) {
      const updatedTags = [...selectedTags, tag];
      setSelectedTags(updatedTags);
      form.setValue('tags', updatedTags.map(t => t.id.toString()));
    }
    setTagInput('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove: { id: number; name: string }) => {
    const updatedTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    setSelectedTags(updatedTags);
    form.setValue('tags', updatedTags.map(t => t.id.toString()));
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!pdfFile) {
      setPdfError('Please upload a PDF file');
      return;
    }
    
    // Create FormData for file uploads
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('abstract', values.abstract);
    formData.append('content', values.content || '');
    formData.append('categoryId', values.categoryId);
    formData.append('publicationDate', values.publicationDate.toISOString());
    
    if (values.doi) {
      formData.append('doi', values.doi);
    }
    
    // Add tags - ensure we're sending IDs
    if (values.tags && values.tags.length > 0) {
      values.tags.forEach((tagId, index) => {
        formData.append(`tags[${index}]`, tagId);
      });
    }
    
    // Add files
    formData.append('pdf', pdfFile);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    
    // Submit the form
    try {
      const result = await createJournal(formData);
      if (result) {
        toast.success('Journal created successfully!');
        router.push('/my-journals');
      }
    } catch (err) {
      toast.error('Failed to create journal. Please try again.');
    }
  };
  
  return (
    <div className="container max-w-7xl py-10 mx-auto">
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">Create New Journal</h1>
              <p className="text-muted-foreground">Share your research with the academic community</p>
            </div>
            <Button 
              onClick={() => router.push('/my-journals')}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            variants={itemVariants}
            className="relative rounded-xl border bg-card overflow-hidden p-6 lg:col-span-2"
            style={{
              background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
            }}
          >
            {/* Hex grid pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5.5l25 15v30l-25 15-25-15v-30z' stroke='%23a855f7' stroke-opacity='0.2' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />
            
            {/* Glow effect */}
            <div className="absolute inset-0 z-0 opacity-30"
              style={{
                background: "radial-gradient(circle at 50% 50%, var(--glow-color) 0%, transparent 70%)",
              }}
            />
            
            <div className="relative z-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Title field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter the title of your journal" 
                              className="text-lg py-6 bg-background/20 backdrop-blur-sm border-white/10" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a clear, descriptive title that effectively represents your research.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* Abstract field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="abstract"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Abstract</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a summary of your research" 
                              className="min-h-32 resize-y text-base bg-background/20 backdrop-blur-sm border-white/10"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A concise summary of your research including objectives, methods, results, and conclusions (50-2000 characters).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* Category field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-background/20 backdrop-blur-sm border-white/10">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem 
                                  key={category.id} 
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the most appropriate category for your research.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* Publication Date field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="publicationDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base font-semibold">Publication Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal bg-background/20 backdrop-blur-sm border-white/10"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Select the date when this research was or will be published.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* DOI field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="doi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            DOI (Digital Object Identifier)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="10.xxxx/xxxxx" 
                              className="bg-background/20 backdrop-blur-sm border-white/10"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="flex items-center gap-1">
                            <Info className="h-4 w-4" />
                            Optional. If your paper has already been assigned a DOI, enter it here.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* Tags field */}
                  <motion.div variants={itemVariants}>
                    <div className="space-y-2">
                      <FormLabel className="text-base font-semibold">Tags</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedTags.map(tag => (
                          <div 
                            key={tag.id} 
                            className="bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1 backdrop-blur-sm"
                          >
                            <span>{tag.name}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-primary-foreground/60 hover:text-primary-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <Select onValueChange={handleTagSelect}>
                        <SelectTrigger className="w-full bg-background/20 backdrop-blur-sm border-white/10">
                          <SelectValue placeholder="Select tags for your journal" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTags.map((tag) => (
                            <SelectItem 
                              key={tag.id} 
                              value={tag.id.toString()}
                              disabled={selectedTags.some(t => t.id === tag.id)}
                            >
                              {tag.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <FormDescription>
                        Add up to 5 tags that best describe your research.
                      </FormDescription>
                    </div>
                  </motion.div>
                  
                  {/* Content field - optional additional details */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Additional Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any additional information about your journal article" 
                              className="min-h-24 resize-y bg-background/20 backdrop-blur-sm border-white/10"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Optional. Include any additional information that may be relevant.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* PDF Upload */}
                  <motion.div variants={itemVariants}>
                    <div className="space-y-2">
                      <FormLabel className="text-base font-semibold">Upload PDF Document</FormLabel>
                      <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-background/30 backdrop-blur-sm
                        ${pdfFile ? 'border-primary/50 bg-primary/5' : 'border-white/20 hover:border-primary/30 hover:bg-muted/50'} 
                        ${pdfError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                      >
                        {!pdfFile ? (
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-base font-medium">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground">PDF (Max 10MB)</p>
                            </div>
                            <Button type="button" size="sm" variant="outline" className="bg-background/20 border-white/10">
                              <Upload className="mr-2 h-4 w-4" />
                              Select PDF
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-base font-medium">{pdfFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <Button type="button" size="sm" variant="outline" onClick={() => setPdfFile(null)} className="bg-background/20 border-white/10">
                              <X className="mr-2 h-4 w-4" />
                              Remove File
                            </Button>
                          </div>
                        )}
                        <input
                          type="file"
                          id="pdf-upload"
                          accept=".pdf"
                          onChange={handlePdfChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      {pdfError && (
                        <p className="text-destructive text-sm">{pdfError}</p>
                      )}
                      <FormDescription>
                        Upload your full research paper as a PDF document.
                      </FormDescription>
                    </div>
                  </motion.div>
                  
                  {/* Thumbnail Upload - optional */}
                  <motion.div variants={itemVariants}>
                    <div className="space-y-2">
                      <FormLabel className="text-base font-semibold">
                        Thumbnail Image (Optional)
                      </FormLabel>
                      <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-background/30 backdrop-blur-sm
                        ${thumbnailFile ? 'border-primary/50 bg-primary/5' : 'border-white/20 hover:border-primary/30 hover:bg-muted/50'} 
                        ${thumbnailError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                      >
                        {!thumbnailFile ? (
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-base font-medium">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground">JPEG, PNG, WebP (Max 2MB)</p>
                            </div>
                            <Button type="button" size="sm" variant="outline" className="bg-background/20 border-white/10">
                              <Upload className="mr-2 h-4 w-4" />
                              Select Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="mx-auto w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(thumbnailFile)}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-base font-medium">{thumbnailFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <Button type="button" size="sm" variant="outline" onClick={() => setThumbnailFile(null)} className="bg-background/20 border-white/10">
                              <X className="mr-2 h-4 w-4" />
                              Remove Image
                            </Button>
                          </div>
                        )}
                        <input
                          type="file"
                          id="thumbnail-upload"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleThumbnailChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      {thumbnailError && (
                        <p className="text-destructive text-sm">{thumbnailError}</p>
                      )}
                      <FormDescription>
                        Upload a cover image for your journal (recommended for better visibility).
                      </FormDescription>
                    </div>
                  </motion.div>
                  
                  {/* Submit Button */}
                  <motion.div variants={itemVariants} className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.push('/myjournals')}
                        className="sm:order-1 bg-background/20 backdrop-blur-sm border-white/10"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="gap-2 text-base py-6 bg-primary/90 hover:bg-primary/80"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            Creating Journal...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            Publish Journal
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                  
                  {/* API Error display */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive backdrop-blur-sm"
                    >
                      <p>{error}</p>
                    </motion.div>
                  )}
                </form>
              </Form>
            </div>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="rounded-xl border overflow-hidden p-6 h-fit sticky top-6 lg:col-span-1"
            style={{
              background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
            }}
          >
            {/* Hex grid pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5.5l25 15v30l-25 15-25-15v-30z' stroke='%23a855f7' stroke-opacity='0.2' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />
            
            {/* Small accent line at the top */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/30"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-4">
                Journal Submission Guide
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-purple-500">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/10">
                      1
                    </span>
                    Before Submission
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Ensure your title clearly represents your research findings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Write a concise yet comprehensive abstract (50-2000 characters)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Select the appropriate category for better discoverability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Add relevant tags to help readers find your work</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Upload your PDF document (required, max 10MB)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Add a thumbnail image for better visibility (optional)</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-emerald-500">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/10">
                      2
                    </span>
                    After Submission
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>Your journal will be reviewed by our admin team</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>You'll receive notification once reviewed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>If approved, your journal will be publicly accessible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>You can track views, downloads, and comments</span>
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-lg bg-background/10 backdrop-blur-sm p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-amber-500 mb-1">Important Note</h5>
                      <p className="text-sm text-muted-foreground">
                        Ensure that you have all necessary rights to publish the content and that it does not violate any copyright laws or academic ethics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateJournalPage;
