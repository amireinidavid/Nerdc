"use client";

import React, { useEffect, useState } from 'react';
import useProfileStore, { ProfileUser, ProfileStatus } from '@/store/useProfileStore';
import {  UserRole } from '@/store/authStore';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, MoreHorizontal, Search, UserPlus, X } from "lucide-react";
import { toast } from 'react-hot-toast';
import Image from 'next/image';

// Form schema for user creation/editing
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["USER", "AUTHOR", "ADMIN"]),
  profileStatus: z.enum(["COMPLETE", "INCOMPLETE"]),
  institution: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

// Extend the schema for user creation to include password
const createUserFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(["USER", "AUTHOR", "ADMIN"]),
  profileStatus: z.enum(["COMPLETE", "INCOMPLETE"]),
  institution: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate that authors have required fields
  if (data.role === "AUTHOR") {
    if (!data.institution) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Institution is required for Authors",
        path: ["institution"]
      });
    }
    
    if (!data.department) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is required for Authors",
        path: ["department"]
      });
    }
    
    if (!data.position) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Position is required for Authors",
        path: ["position"]
      });
    }
  }
});

type UserFormValues = z.infer<typeof userFormSchema>;
type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

const AdminUserPage = () => {
  const { 
    users, 
    usersPagination, 
    isLoading, 
    error, 
    getUsers, 
    updateUser, 
    createUser,
    clearError 
  } = useProfileStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<ProfileStatus | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form for editing/creating users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "USER",
      profileStatus: "INCOMPLETE",
      institution: "",
      department: "",
      position: "",
      phone: "",
      country: "",
      state: "",
      city: "",
    },
  });
  
  // Initialize create form separately for the password field
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
      profileStatus: "INCOMPLETE",
      institution: "",
      department: "",
      position: "",
      phone: "",
      country: "",
      state: "",
      city: "",
    },
  });
  
  // Fetch users when component mounts or filters change
  useEffect(() => {
    fetchUsers();
    
    // Animation delay
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    setFadeIn(false);
    try {
      await getUsers({
        page: currentPage,
        limit: 10,
        role: selectedRole,
        profileStatus: selectedStatus,
        search: searchTerm || undefined,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setTimeout(() => setFadeIn(true), 300);
  };

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchUsers();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRole(undefined);
    setSelectedStatus(undefined);
    setCurrentPage(1);
  };

  // Open edit dialog and populate form
  const handleEditUser = (user: ProfileUser) => {
    setSelectedUser(user);
    form.reset({
      name: user.name || "",
      email: user.email || "",
      role: user.role as UserRole,
      profileStatus: user.profileStatus as ProfileStatus,
      institution: user.institution || undefined,
      department: user.department || undefined,
      position: user.position || undefined,
      phone: user.phone || undefined,
      country: user.country || undefined,
      state: user.state || undefined,
      city: user.city || undefined,
    });
    setIsEditDialogOpen(true);
  };

  // Open create user dialog
  const handleCreateUser = () => {
    createForm.reset({
      name: "",
      email: "",
      password: "",
      role: "USER",
      profileStatus: "INCOMPLETE",
      institution: "",
      department: "",
      position: "",
      phone: "",
      country: "",
      state: "",
      city: "",
    });
    setIsCreateDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteUser = (user: ProfileUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Submit handler for edit form
  const onEditSubmit = async (values: UserFormValues) => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.id, values);
      setIsEditDialogOpen(false);
      toast.success("User updated successfully!");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user. Please try again.");
    }
  };

  // Submit handler for create form
  const onCreateSubmit = async (values: CreateUserFormValues) => {
    try {
      setIsSubmitting(true); // Add loading state
      await createUser(values);
      setIsCreateDialogOpen(false);
      toast.success("User created successfully!");
      fetchUsers();
    } catch (error: any) {
      // Extract more specific error message if available
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Failed to create user. Please try again.";
      toast.error(errorMessage);
      // Set form error if specific field errors exist
      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors;
        Object.keys(fieldErrors).forEach(field => {
          if (createForm.getFieldState(field as any)) {
            createForm.setError(field as any, { 
              type: 'server', 
              message: fieldErrors[field] 
            });
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // This is a placeholder - the actual API call would need to be implemented
      // in the profile store for deleting users
      console.log("Delete user:", selectedUser.id);
      toast.success("User deleted successfully!");
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  // Get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return "default"; // emerald by default
      case 'AUTHOR':
        return "secondary"; // purple
      default:
        return "outline"; // outline for regular users
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 text-gray-800 pt-20 pb-16">
      <Container>
        {/* Page Header */}
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <Button
              onClick={handleCreateUser}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </div>
          <p className="text-gray-600 mb-8">Manage user accounts, roles, and permissions</p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border-emerald-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800">Filter Users</CardTitle>
            <CardDescription>Search and filter the list of users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-emerald-200 bg-white"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:w-2/5">
                <Select
                  value={selectedRole || "ALL"}
                  onValueChange={(value) => setSelectedRole(value === "ALL" ? undefined : value as UserRole)}
                >
                  <SelectTrigger className="border-emerald-200 bg-white">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="AUTHOR">Author</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedStatus || "ALL"}
                  onValueChange={(value) => setSelectedStatus(value === "ALL" ? undefined : value as ProfileStatus)}
                >
                  <SelectTrigger className="border-emerald-200 bg-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                    <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-emerald-200 hover:bg-emerald-50 text-gray-800"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <div className={`transition-all duration-700 delay-100 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border-emerald-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              {isLoading && !users.length ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 border-4 border-t-emerald-500 border-gray-200 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : !users.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">No users found</h3>
                  <p className="text-gray-600 max-w-md">There are no users matching your search criteria. Try adjusting your filters or add a new user.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-50 hover:bg-emerald-50/80">
                        <TableHead className="font-semibold text-emerald-700">Name</TableHead>
                        <TableHead className="font-semibold text-emerald-700">Email</TableHead>
                        <TableHead className="font-semibold text-emerald-700">Role</TableHead>
                        <TableHead className="font-semibold text-emerald-700">Status</TableHead>
                        <TableHead className="font-semibold text-emerald-700">Institution</TableHead>
                        <TableHead className="text-right font-semibold text-emerald-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow 
                          key={user.id}
                          className="border-b border-emerald-100 hover:bg-emerald-50/50"
                        >
                          <TableCell className="font-medium text-gray-800">
                            {user.profileImage ? (
                              <div className="flex items-center">
                                <Image 
                                  src={user.profileImage || ""} 
                                  alt={user.name || ""} 
                                  className="w-8 h-8 rounded-full mr-2 border border-emerald-200"
                                  width={32}
                                  height={32}
                                />
                                {user.name}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2 border border-emerald-200">
                                  {user.name?.charAt(0) || 'U'}
                                </div>
                                {user.name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.profileStatus === 'COMPLETE' ? 'outline' : 'secondary'}
                              className={user.profileStatus === 'COMPLETE' 
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50' 
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}
                            >
                              {user.profileStatus.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {user.institution || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-emerald-200">
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                  className="cursor-pointer text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user)}
                                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pagination */}
        {usersPagination && usersPagination.pages > 1 && (
          <div className={`flex justify-center mt-8 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={`border border-emerald-200 ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-emerald-50'}`}
                  />
                </PaginationItem>
                
                {Array.from({ length: usersPagination.pages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === usersPagination.pages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => {
                    // If there's a gap between numbers, show ellipsis
                    if (index > 0 && page > array[index - 1] + 1) {
                      return (
                        <React.Fragment key={`ellipsis-${page}`}>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => { 
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={page === currentPage}
                              className={page === currentPage 
                                ? 'bg-emerald-600 text-white' 
                                : 'border border-emerald-200 hover:bg-emerald-50'
                              }
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { 
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={page === currentPage}
                          className={page === currentPage 
                            ? 'bg-emerald-600 text-white' 
                            : 'border border-emerald-200 hover:bg-emerald-50'
                          }
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, usersPagination.pages))}
                    className={`border border-emerald-200 ${currentPage === usersPagination.pages ? 'pointer-events-none opacity-50' : 'hover:bg-emerald-50'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Container>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700">Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="border-emerald-200 bg-white" />
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
                    <FormLabel className="text-emerald-700">Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="border-emerald-200 bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700">Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-emerald-200 bg-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-emerald-200">
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="AUTHOR">Author</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="profileStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700">Profile Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-emerald-200 bg-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-emerald-200">
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                        <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Additional fields that show if user is an Author */}
              {form.watch('role') === 'AUTHOR' && (
                <>
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Institution</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Department</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Position</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-emerald-200 hover:bg-emerald-50 text-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700 flex items-center">
                      Name <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="border-emerald-200 bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700 flex items-center">
                      Email <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="border-emerald-200 bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700 flex items-center">
                      Password <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="border-emerald-200 bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-emerald-700 flex items-center">
                      Role <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Force revalidation when role changes to update conditionally required fields
                        setTimeout(() => {
                          createForm.trigger();
                        }, 0);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-emerald-200 bg-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-emerald-200">
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="AUTHOR">Author</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Additional fields that show if user is an Author */}
              {createForm.watch('role') === 'AUTHOR' && (
                <div className="space-y-4 border-l-2 border-emerald-200 pl-4 mt-4">
                  <h3 className="text-sm font-medium text-emerald-700">Author Information</h3>
                  <p className="text-xs text-gray-500 mb-3">The following fields are required for authors</p>
                  
                  <FormField
                    control={createForm.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700 flex items-center">
                          Institution <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700 flex items-center">
                          Department <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700 flex items-center">
                          Position <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Optional Profile Information section */}
              <div className="pt-2">
                <h3 className="text-sm font-medium text-emerald-700 mb-2">Optional Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Phone</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Country</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">State</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">City</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-emerald-200 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-emerald-200 hover:bg-emerald-50 text-gray-800"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center p-4 border border-red-100 rounded-md bg-red-50">
                <div className="mr-4">
                  {selectedUser.profileImage ? (
                    <Image 
                      src={selectedUser.profileImage || ""} 
                      alt={selectedUser.name || ""} 
                      className="w-12 h-12 rounded-full border border-red-200"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      {selectedUser.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-red-900">{selectedUser.name}</p>
                  <p className="text-sm text-red-700">{selectedUser.email}</p>
                  <div className="mt-1">
                    <Badge variant="outline" className="border-red-300 text-red-600 bg-red-50">
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-emerald-200 hover:bg-emerald-50 text-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;
