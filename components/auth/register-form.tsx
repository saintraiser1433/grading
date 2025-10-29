"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, User, Building, Upload, FileText, X } from "lucide-react"
import { AuthBrandSection } from "./auth-brand-section"
import { registerStudent, uploadEnrollmentDocument } from "@/lib/actions/student-registration.actions"
import { useToast } from "@/hooks/use-toast"

export function RegisterForm() {
  console.log("RegisterForm component rendering...")
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const userType = "student" // Always register as student
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    studentId: "",
    password: "",
    agreeToTerms: false,
  })
  const [documents, setDocuments] = useState<File[]>([])
  const [documentTypes, setDocumentTypes] = useState<string[]>([])
  const { toast } = useToast()

  // Test if component is working
  const testFunction = () => {
    console.log("TEST FUNCTION CALLED!")
    alert("Component is working!")
  }

  // Monitor documents state changes
  useEffect(() => {
    // Documents state updated
  }, [documents])

  // Monitor form data changes
  useEffect(() => {
    // Form data updated
  }, [formData])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      
      setDocuments(prev => [...prev, ...fileArray])
      setDocumentTypes(prev => [...prev, ...fileArray.map(() => "ENROLLMENT_FORM")])
      
      toast({
        title: "Files uploaded!",
        description: `${fileArray.length} file(s) added successfully`,
      })
    }
  }


  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
    setDocumentTypes(prev => prev.filter((_, i) => i !== index))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== FORM SUBMISSION STARTED ===")
    console.log("Form data:", formData)
    console.log("Documents:", documents.length)
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.studentId || !formData.password) {
      console.log("Validation failed - missing required fields")
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    try {
      if (userType === "student") {
        console.log("Registering student...")
        
        const registrationData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || undefined,
          email: formData.email,
          studentId: formData.studentId,
          password: formData.password,
        }
        
        console.log("Registration data:", registrationData)
        
        // Register student
        const result = await registerStudent(registrationData)

        console.log("Registration result:", result)

        if (result.success) {
          console.log("Registration successful, uploading documents...")
          console.log("Number of documents to upload:", documents.length)
          console.log("Document types array:", documentTypes)
          
          // Upload documents
          for (let i = 0; i < documents.length; i++) {
            const file = documents[i]
            
            console.log(`Uploading file ${i + 1}:`, file.name, "Size:", file.size, "Type:", file.type)
            
            try {
              // Upload file to server
              const formData = new FormData()
              formData.append('file', file)
              
              console.log("Sending upload request to /api/upload")
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              })
              
              console.log("Upload response status:", uploadResponse.status)
              const uploadResult = await uploadResponse.json()
              console.log("Upload result:", uploadResult)
              
              if (uploadResult.success) {
                // Save document metadata to database
                console.log("Saving document metadata to database...")
                console.log("Document data being saved:", {
                  userId: result.data?.id || "",
                  fileName: uploadResult.data.fileName,
                  fileUrl: uploadResult.data.filePath,
                  fileType: uploadResult.data.fileType,
                  fileSize: uploadResult.data.fileSize,
                  documentType: documentTypes[i],
                })
                
                const docResult = await uploadEnrollmentDocument({
                  userId: result.data?.id || "",
                  fileName: uploadResult.data.fileName,
                  fileUrl: uploadResult.data.filePath,
                  fileType: uploadResult.data.fileType,
                  fileSize: uploadResult.data.fileSize,
                  documentType: documentTypes[i] as any,
                })
                console.log("Document save result:", docResult)
                
                if (docResult.success) {
                  console.log(`✅ File ${i + 1} uploaded and saved successfully:`, uploadResult.data.fileName)
                } else {
                  console.error(`❌ Failed to save document metadata for file ${i + 1}:`, docResult.error)
                }
              } else {
                console.error(`Failed to upload file ${i + 1}:`, uploadResult.error)
              }
            } catch (uploadError) {
              console.error(`Error uploading file ${i + 1}:`, uploadError)
            }
          }

          console.log("All documents uploaded, showing success message...")
          
          toast({
            title: "Registration Successful!",
            description: "Your registration has been submitted for admin approval. You will receive an email once approved.",
          })
          
          // Wait a moment for the toast to show, then redirect
          setTimeout(() => {
            console.log("Redirecting to login...")
            window.location.href = "/auth/login"
          }, 2000)
        } else {
          console.log("Registration failed:", result.error)
          toast({
            title: "Registration Failed",
            description: result.error || "Failed to register. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // For teachers and admins, redirect to admin registration
        window.location.href = "/admin/register"
      }
    } catch (error) {
      console.log("Registration error:", error)
      console.error("Full error details:", error)
      
      let errorMessage = "An unexpected error occurred. Please try again."
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex">
      <AuthBrandSection />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-lg">
          <div className="space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white dark:text-slate-900 font-bold text-xl">G</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">GIT Grading System</h1>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">GIT Grading System Registration</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Join the GIT Grading System as a student to access your grades, enroll in subjects, and track your academic progress. 
                Our comprehensive platform provides real-time grade updates, detailed performance analytics, and seamless communication with your instructors.
              </p>
              
            </div>

            <form onSubmit={(e) => {
              console.log("FORM SUBMIT EVENT TRIGGERED!")
              handleSubmit(e)
            }} className="space-y-6">

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300">First name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        className="pl-10 h-11"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Last name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className="h-11"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Middle name</Label>
                  <Input
                    id="middleName"
                    type="text"
                    placeholder="Middle name (optional)"
                    className="h-11"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Contact Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10 h-11"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {userType === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-sm font-medium text-slate-700 dark:text-slate-300">Student ID *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="studentId"
                        type="text"
                        placeholder="Enter your student ID"
                        className="pl-10 h-11"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Security</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-11"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Upload for Students */}
              {userType === "student" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Enrollment Documents</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Required Documents *</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Upload multiple documents for enrollment validation (PDF, JPG, PNG)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        💡 You can select multiple files at once or upload them in batches
                      </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-3">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500 dark:text-slate-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-100 dark:file:bg-blue-900
                          file:text-blue-700 dark:file:text-blue-300
                          hover:file:bg-blue-200 dark:hover:file:bg-blue-800
                          cursor-pointer border border-slate-300 dark:border-slate-600 rounded-lg p-2"
                      />
                      
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✅ {documents.length} file{documents.length !== 1 ? 's' : ''} uploaded successfully
                      </p>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        💡 To select multiple files: Hold Ctrl (Windows) or Cmd (Mac) while clicking files
                      </p>
                      
                      
                      
                      
                    </div>
                  </div>

                  {/* Uploaded Documents */}
                  {documents.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Uploaded Documents ({documents.length})
                        </Label>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Ready for submission
                        </span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {documents.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Agreements</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreeToTerms}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))
                      }}
                      required
                      className="mt-1 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 leading-5 cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" className="text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:hover:text-slate-300 font-medium underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:hover:text-slate-300 font-medium underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={isLoading}
                  onClick={() => {
                    console.log("CREATE ACCOUNT BUTTON CLICKED!")
                  }}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>


            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:hover:text-slate-300 font-medium underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
