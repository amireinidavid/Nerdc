"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  User,
  Settings,
  FileText,
  Edit3,
  Trash2,
  ChevronRight,
  Save,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

// Store
import useProfileStore, { ProfileUser, ResearcherProfile } from '@/store/useProfileStore';
import useAuthStore from '@/store/authStore';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Staggered container animation
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AccountPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { 
    isLoading, 
    error, 
    getProfile, 
    updateProfile, 
    toggleResearcherStatus, 
    isResearcher,
    clearError
  } = useProfileStore();

  // Get the typed user data
  const profileUser = user as ProfileUser | null;
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
    
    // Contact info
    phone: profileUser?.phone || '',
    address: profileUser?.address || '',
    city: profileUser?.city || '',
    state: profileUser?.state || '',
    country: profileUser?.country || '',
    postalCode: profileUser?.postalCode || '',
    website: profileUser?.website || '',
    linkedinUrl: profileUser?.linkedinUrl || '',
    twitterHandle: profileUser?.twitterHandle || '',
  });

  // Researcher form state (only used if user is a researcher)
  const [researcherData, setResearcherData] = useState<ResearcherProfile>({
    institution: '',
    department: '',
    position: '',
    researchInterests: '',
    orcidId: '',
    googleScholarId: '',
    publicationsCount: undefined,
    citationsCount: undefined,
    hIndex: undefined,
  });

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showResearcherDialog, setShowResearcherDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [researcherToggle, setResearcherToggle] = useState(isResearcher());

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated) {
        const profile = await getProfile();
        console.log(profile, "profile");
        // If we got profile data, update the form
        if (profile) {
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            bio: profile.bio || '',
            profileImage: profile.profileImage || '',
            phone: profile.phone || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            country: profile.country || '',
            postalCode: profile.postalCode || '',
            website: profile.website || '',
            linkedinUrl: profile.linkedinUrl || '',
            twitterHandle: profile.twitterHandle || '',
          });

          // Set researcher data if available
          if (profile.role === 'AUTHOR') {
            const researcher = profile.researcher;
            if (researcher) {
              setResearcherData({
                institution: researcher.institution || '',
                department: researcher.department || '',
                position: researcher.position || '',
                researchInterests: researcher.researchInterests || '',
                orcidId: researcher.orcidId || '',
                googleScholarId: researcher.googleScholarId || '',
                publicationsCount: researcher.publicationsCount,
                citationsCount: researcher.citationsCount,
                hIndex: researcher.hIndex,
              });
            }
            setResearcherToggle(true);
          } else {
            setResearcherToggle(false);
          }
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    };

    fetchProfile();
  }, [isAuthenticated, getProfile, router]);

  // Clear any errors when changing tabs
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [activeTab, error, clearError]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle researcher form changes
  const handleResearcherChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResearcherData(prev => ({ 
      ...prev, 
      [name]: name.includes('Count') || name === 'hIndex' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  // Save profile changes
  const handleProfileSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  // Toggle researcher status
  const handleResearcherToggle = async () => {
    try {
      // If turning off researcher status, just pass undefined
      // If turning on, pass the researcher data
      await toggleResearcherStatus(researcherToggle ? undefined : researcherData);
      toast.success(researcherToggle 
        ? 'Switched to regular user account' 
        : 'Switched to researcher account');
      setShowResearcherDialog(false);
      
      // Refresh profile data
      getProfile();
    } catch (err) {
      toast.error('Failed to update researcher status');
    }
  };

  // Handle account deletion (this would need to be implemented in your API)
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) {
      toast.error('Email confirmation does not match');
      return;
    }
    
    try {
      // Replace with your actual API call
      // await profileAPI.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
      router.push('/');
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-emerald-50">
      <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Settings</h1>
            <p className="text-gray-500 mt-1">Manage your profile and account preferences</p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 sm:mt-0 space-x-3">
            {isEditing ? (
              <Button 
                onClick={handleProfileSave} 
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            ) : (
              <Button 
                onClick={toggleEdit}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
                  {user?.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt={user.name || 'Profile'} 
                      fill 
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=User';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-emerald-600" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">
                  {isResearcher() ? 'Researcher' : 'Regular User'}
                </div>
                
                {user?.bio && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-4">{user.bio}</p>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <nav className="space-y-1">
                <TabsList className="flex flex-col w-full bg-transparent space-y-1 h-auto">
                  <TabsTrigger
                    value="general"
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center justify-start py-2 px-3 w-full rounded-md ${
                      activeTab === 'general' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    General
                  </TabsTrigger>
                  
                  <TabsTrigger
                    value="contact"
                    onClick={() => setActiveTab('contact')}
                    className={`flex items-center justify-start py-2 px-3 w-full rounded-md ${
                      activeTab === 'contact' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Contact & Social
                  </TabsTrigger>
                  
                  {isResearcher() && (
                    <TabsTrigger
                      value="researcher"
                      onClick={() => setActiveTab('researcher')}
                      className={`flex items-center justify-start py-2 px-3 w-full rounded-md ${
                        activeTab === 'researcher' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Researcher Info
                    </TabsTrigger>
                  )}
                  
                  <TabsTrigger
                    value="danger"
                    onClick={() => setActiveTab('danger')}
                    className={`flex items-center justify-start py-2 px-3 w-full rounded-md ${
                      activeTab === 'danger' 
                        ? 'bg-red-50 text-red-700' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Danger Zone
                  </TabsTrigger>
                </TabsList>
              </nav>
            </CardContent>
          </Card>
          
          {/* Main Content Area */}
          <motion.div 
            className="md:col-span-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* General Tab */}
            {activeTab === 'general' && (
              <motion.div variants={fadeIn} key="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>
                      Manage your personal information and profile settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            disabled={true} // Email should typically not be editable
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileImage">Profile Image URL</Label>
                        <Input
                          id="profileImage"
                          name="profileImage"
                          value={formData.profileImage}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="https://example.com/your-image.jpg"
                          className={isEditing ? "bg-white" : "bg-gray-50"}
                        />
                        {formData.profileImage && isEditing && (
                          <div className="mt-2 relative w-16 h-16 rounded-full overflow-hidden">
                            <Image 
                              src={formData.profileImage}
                              alt="Profile preview"
                              fill
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Tell us about yourself"
                          rows={4}
                          className={isEditing ? "bg-white resize-none" : "bg-gray-50 resize-none"}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Account Type</CardTitle>
                    <CardDescription>
                      Switch between a regular user account and a researcher account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="flex items-start space-x-3">
                        {isResearcher() ? (
                          <FileText className="h-10 w-10 text-emerald-600 mt-0.5" />
                        ) : (
                          <User className="h-10 w-10 text-emerald-600 mt-0.5" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {isResearcher() 
                              ? 'Researcher Account' 
                              : 'Regular User Account'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {isResearcher()
                              ? 'You can publish research, participate in peer reviews, and build your academic profile.'
                              : 'You can access research journals, save favorites, and follow researchers.'}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setShowResearcherDialog(true)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Switch Account Type
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <motion.div variants={fadeIn} key="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Manage your contact details and social profiles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={isEditing ? "bg-white" : "bg-gray-50"}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Social Profiles</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                          <Input
                            id="linkedinUrl"
                            name="linkedinUrl"
                            value={formData.linkedinUrl}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="twitterHandle">Twitter/X Handle</Label>
                          <Input
                            id="twitterHandle"
                            name="twitterHandle"
                            value={formData.twitterHandle}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Researcher Tab (only if user is a researcher) */}
            {activeTab === 'researcher' && isResearcher() && (
              <motion.div variants={fadeIn} key="researcher">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>
                      Manage your research profile and academic credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="institution">Institution</Label>
                          <Input
                            id="institution"
                            name="institution"
                            value={researcherData.institution}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            name="department"
                            value={researcherData.department}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="position">Position/Title</Label>
                        <Input
                          id="position"
                          name="position"
                          value={researcherData.position}
                          onChange={handleResearcherChange}
                          disabled={!isEditing}
                          className={isEditing ? "bg-white" : "bg-gray-50"}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="researchInterests">Research Interests</Label>
                        <Textarea
                          id="researchInterests"
                          name="researchInterests"
                          value={researcherData.researchInterests || ''}
                          onChange={handleResearcherChange}
                          disabled={!isEditing}
                          className={isEditing ? "bg-white resize-none" : "bg-gray-50 resize-none"}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="publicationsCount">Publications Count</Label>
                          <Input
                            id="publicationsCount"
                            name="publicationsCount"
                            type="number"
                            value={researcherData.publicationsCount !== undefined ? researcherData.publicationsCount : ''}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="citationsCount">Citations Count</Label>
                          <Input
                            id="citationsCount"
                            name="citationsCount"
                            type="number"
                            value={researcherData.citationsCount !== undefined ? researcherData.citationsCount : ''}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="hIndex">h-index</Label>
                          <Input
                            id="hIndex"
                            name="hIndex"
                            type="number"
                            value={researcherData.hIndex !== undefined ? researcherData.hIndex : ''}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orcidId">ORCID ID</Label>
                          <Input
                            id="orcidId"
                            name="orcidId"
                            value={researcherData.orcidId || ''}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="googleScholarId">Google Scholar ID</Label>
                          <Input
                            id="googleScholarId"
                            name="googleScholarId"
                            value={researcherData.googleScholarId || ''}
                            onChange={handleResearcherChange}
                            disabled={!isEditing}
                            className={isEditing ? "bg-white" : "bg-gray-50"}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <motion.div variants={fadeIn} key="danger">
                <Card className="border-red-100">
                  <CardHeader className="bg-red-50 rounded-t-lg border-b border-red-100">
                    <CardTitle className="flex items-center text-red-800">
                      <ShieldAlert className="h-5 w-5 mr-2" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-700">
                      These actions are irreversible. Please proceed with caution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Delete Your Account</AlertTitle>
                      <AlertDescription>
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Researcher Toggle Dialog */}
      <Dialog open={showResearcherDialog} onOpenChange={setShowResearcherDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Account Type</DialogTitle>
            <DialogDescription>
              {isResearcher() 
                ? 'Switch to a regular user account and hide your researcher information.' 
                : 'Switch to a researcher account to publish your research and participate in peer reviews.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="researcher-toggle"
                  checked={!researcherToggle} // Inverse value because we're switching FROM researcher
                  onCheckedChange={() => setResearcherToggle(!researcherToggle)}
                />
                <Label htmlFor="researcher-toggle" className="font-medium">
                  {researcherToggle ? 'Switch to Regular User' : 'Switch to Researcher'}
                </Label>
              </div>
            </div>
            
            {!isResearcher() && researcherToggle && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Additional Information Required</AlertTitle>
                <AlertDescription>
                  After switching, you'll need to provide your academic details. 
                  You can edit these in the Researcher Info tab later.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResearcherDialog(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResearcherToggle}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                All your data, including profile information, saved content, and preferences will be deleted.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="font-medium">
                To confirm, type your email address: <span className="font-bold">{user?.email}</span>
              </Label>
              <Input
                id="confirm-delete"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={user?.email}
                className="bg-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== user?.email}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountPage;
