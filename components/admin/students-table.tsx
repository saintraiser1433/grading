"use client"

import React, { useState } from "react"
import { User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Eye, MoreHorizontal, FileText, User as UserIcon, Calendar, Mail, GraduationCap, Download } from "lucide-react"
import { AdminEmptyState } from "@/components/ui/admin-empty-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { useToast } from "@/hooks/use-toast"
import { approveUser } from "@/lib/actions/student-registration.actions"

interface Student extends User {
  enrollmentDocuments: {
    id: string
    fileName: string
    fileType: string
    documentType: string
    uploadedAt: Date
  }[]
}

interface StudentsTableProps {
  students: Student[]
  onApprove: (studentId: string) => void
  onReject: (studentId: string, reason: string) => void
  showActions?: boolean
}

export function StudentsTable({ students, onApprove, onReject, showActions = true }: StudentsTableProps) {
  const [approveId, setApproveId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null)
  const [viewDocumentsId, setViewDocumentsId] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const { toast } = useToast()

  // Test toast on component mount
  React.useEffect(() => {
    console.log("StudentsTable component mounted, testing toast...")
    // Uncomment the line below to test if toast is working
    // toast({ title: "Test", description: "Toast system is working" })
  }, [])


  const handleViewDocument = (document: any) => {
    setViewingDocument(document)
  }

  // Generate a simple image preview
  const generateImagePreview = (doc: any) => {
    // If we have a real file URL, try to show the actual image
    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      return doc.fileUrl // Return the actual file URL for real images
    }

    // Fallback: generate canvas preview for legacy documents
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 300
    canvas.height = 200

    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(1, '#1d4ed8')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add text
    ctx.fillStyle = 'white'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Image Preview', canvas.width / 2, canvas.height / 2 - 20)
    ctx.font = '12px Arial'
    ctx.fillText(doc.fileName || 'Unknown', canvas.width / 2, canvas.height / 2 + 10)

    return canvas.toDataURL()
  }

  // Generate a simple PDF preview
  const generatePDFPreview = (doc: any) => {
    // If we have a real file URL, show a PDF icon with link
    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 300
      canvas.height = 200

      // Create a white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add border
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)

      // Add PDF icon
      ctx.fillStyle = '#dc2626'
      ctx.font = '48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PDF', canvas.width / 2, canvas.height / 2 - 20)

      // Add filename
      ctx.fillStyle = '#374151'
      ctx.font = '12px Arial'
      ctx.fillText(doc.fileName || 'Unknown', canvas.width / 2, canvas.height / 2 + 20)

      return canvas.toDataURL()
    }

    // Fallback: generate canvas preview for legacy documents
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 300
    canvas.height = 200

    // Create a white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add border
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Add PDF icon
    ctx.fillStyle = '#dc2626'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('PDF', canvas.width / 2, canvas.height / 2 - 20)

    // Add filename
    ctx.fillStyle = '#374151'
    ctx.font = '12px Arial'
    ctx.fillText(doc.fileName || 'Unknown', canvas.width / 2, canvas.height / 2 + 20)

    return canvas.toDataURL()
  }

  const handleDownloadDocument = (doc: any) => {
    try {
      console.log("Downloading document:", doc)
      
      // Simple fallback content if document is empty or invalid
      if (!doc) {
        throw new Error("Document is null or undefined")
      }
      
      // Check if we have a real file URL
      if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
        // Download real file
        const downloadUrl = `/api/download?path=${encodeURIComponent(doc.fileUrl)}`
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = doc.fileName || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download Started",
          description: `Downloading ${doc.fileName || "document"}`,
        })
      } else {
        // Fallback: create info file for simulated documents
        const content = `GIT GRADING SYSTEM - DOCUMENT INFORMATION
==============================================

⚠️  IMPORTANT: This document was uploaded before real file storage was implemented.
   Only document metadata is available.

Document Details:
----------------
File Name: ${doc.fileName || "Unknown"}
Document Type: ${doc.documentType || "Unknown"}
Student ID: ${doc.userId || "Unknown"}
File Size: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + " KB" : "Unknown"}
Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "Unknown"}

System Status:
-------------
✅ Student registration system: WORKING
✅ Document metadata storage: WORKING
✅ Admin approval workflow: WORKING
✅ Real file upload/download: NOW IMPLEMENTED

Note: This document was uploaded before the file storage system was implemented.
New uploads will have real file downloads available.

Generated on: ${new Date().toLocaleString()}
System: GIT Grading System v1.0`

        // Create a text file
        const blob = new Blob([content], { type: "text/plain" })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `document-info-${doc.fileName?.split('.')[0] || 'unknown'}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Document Info Downloaded",
          description: "Downloaded document information (legacy document)",
        })
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Failed",
        description: `Failed to download document: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Generate PDF content (simulated)
  const generatePDFContent = (doc: any) => {
    // This creates a simple PDF-like structure (simulated)
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(Student Document) Tj
0 -20 Td
(File: ${doc.fileName || "Unknown"}) Tj
0 -20 Td
(Type: ${doc.documentType || "Unknown"}) Tj
0 -20 Td
(Student ID: ${doc.userId || "Unknown"}) Tj
0 -20 Td
(Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "Unknown"}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
454
%%EOF`
  }

  // Generate image content (simulated)
  const generateImageContent = (doc: any, format: string) => {
    // Create a simple image using canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 400
    canvas.height = 300
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(1, '#1d4ed8')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add text
    ctx.fillStyle = 'white'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Student Document', canvas.width / 2, canvas.height / 2 - 40)
    ctx.font = '16px Arial'
    ctx.fillText(doc.fileName || 'Unknown', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '14px Arial'
    ctx.fillText(`Type: ${doc.documentType || 'Unknown'}`, canvas.width / 2, canvas.height / 2 + 20)
    ctx.fillText(`Student ID: ${doc.userId || 'Unknown'}`, canvas.width / 2, canvas.height / 2 + 45)
    
    return canvas.toDataURL(`image/${format}`)
  }

  // Generate Word document content (simulated)
  const generateWordDocumentContent = (doc: any) => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Student Document</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>File Name: ${doc.fileName || "Unknown"}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Document Type: ${doc.documentType || "Unknown"}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Student ID: ${doc.userId || "Unknown"}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "Unknown"}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`
  }

  // Generate Excel content (simulated)
  const generateExcelContent = (doc: any) => {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row>
      <c><v>Student Document</v></c>
    </row>
    <row>
      <c><v>File Name</v></c>
      <c><v>${doc.fileName || "Unknown"}</v></c>
    </row>
    <row>
      <c><v>Document Type</v></c>
      <c><v>${doc.documentType || "Unknown"}</v></c>
    </row>
    <row>
      <c><v>Student ID</v></c>
      <c><v>${doc.userId || "Unknown"}</v></c>
    </row>
    <row>
      <c><v>Upload Date</v></c>
      <c><v>${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "Unknown"}</v></c>
    </row>
  </sheetData>
</worksheet>`
  }

  // Helper functions to generate document content
  const generateEnrollmentFormContent = (doc: any) => {
    return `ENROLLMENT FORM
Student ID: ${doc.userId || "N/A"}
Document Type: ${doc.documentType || "N/A"}
File Name: ${doc.fileName || "N/A"}
Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
File Size: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "N/A"} KB

This is a simulated enrollment form document.
In a real application, this would contain the actual form data.`
  }

  const generateIdPhotoContent = (doc: any) => {
    return `ID PHOTO
Student ID: ${doc.userId || "N/A"}
Document Type: ${doc.documentType || "N/A"}
File Name: ${doc.fileName || "N/A"}
Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
File Size: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "N/A"} KB

This is a simulated ID photo document.
In a real application, this would contain the actual image data.`
  }

  const generateTranscriptContent = (doc: any) => {
    return `ACADEMIC TRANSCRIPT
Student ID: ${doc.userId || "N/A"}
Document Type: ${doc.documentType || "N/A"}
File Name: ${doc.fileName || "N/A"}
Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
File Size: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "N/A"} KB

This is a simulated academic transcript document.
In a real application, this would contain the actual transcript data.`
  }

  const generateBirthCertificateContent = (doc: any) => {
    return `BIRTH CERTIFICATE
Student ID: ${doc.userId || "N/A"}
Document Type: ${doc.documentType || "N/A"}
File Name: ${doc.fileName || "N/A"}
Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
File Size: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "N/A"} KB

This is a simulated birth certificate document.
In a real application, this would contain the actual certificate data.`
  }

  const generateGenericDocumentContent = (doc: any) => {
    return `DOCUMENT
Student ID: ${doc.userId || "N/A"}
Document Type: ${doc.documentType || "N/A"}
File Name: ${doc.fileName || "N/A"}
Upload Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
File Size: ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "N/A"} KB

This is a simulated document.
In a real application, this would contain the actual document data.`
  }

  const handleDownloadAllDocuments = (documents: any[]) => {
    try {
      documents.forEach((doc, index) => {
        // Add a small delay between downloads to avoid browser blocking
        setTimeout(() => {
          handleDownloadDocument(doc)
        }, index * 500) // 500ms delay between each download
      })

      toast({
        title: "Bulk Download Started",
        description: `Downloading ${documents.length} documents...`,
      })
    } catch (error) {
      console.error("Bulk download error:", error)
      toast({
        title: "Bulk Download Failed",
        description: "Failed to download all documents",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async () => {
    if (!approveId) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("studentId", approveId)
      
      const response = await fetch("/api/admin/students", {
        method: "POST",
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log("Approve response:", result)
        console.log("Showing success toast for approval")
        toast({
          title: "✅ Success",
          description: "Student approved successfully!",
        })
        setApproveId(null)
        // Show toast for 2 seconds before reload
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error("Approve error:", errorData)
        throw new Error(errorData.error || "Failed to approve student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve student",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return

    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to permanently delete this student registration?\n\nThis action cannot be undone and will remove:\n- Student account\n- All uploaded documents\n- All associated data\n\nReason: ${rejectReason}`)
    if (!confirmed) {
      setRejectId(null)
      setRejectReason("")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("studentId", rejectId)
      formData.append("reason", rejectReason)
      formData.append("action", "reject")
      
      const response = await fetch("/api/admin/students", {
        method: "POST",
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log("Reject response:", result)
        console.log("Showing success toast for deletion")
        toast({
          title: "✅ Student Removed",
          description: "Student registration has been permanently deleted from the system.",
        })
        setRejectId(null)
        setRejectReason("")
        // Show toast for 2 seconds before reload
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error("Reject error:", errorData)
        throw new Error(errorData.error || "Failed to reject student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject student",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {student.firstName} {student.middleName && `${student.middleName} `}{student.lastName}
            </div>
            <div className="text-sm text-muted-foreground">{student.email}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "studentId",
      header: "Student ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("studentId")}</div>
      ),
    },
    {
      accessorKey: "documents",
      header: "Documents",
      cell: ({ row }) => {
        const documents = row.original.enrollmentDocuments || []
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{documents.length} files</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const getStatusStyle = (status: string) => {
          switch (status) {
            case "PENDING":
              return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0"
            case "APPROVED":
              return "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0"
            case "REJECTED":
              return "bg-gradient-to-r from-red-400 to-rose-500 text-white border-0"
            default:
              return "bg-gray-500 text-white border-0"
          }
        }
        return (
          <Badge className={getStatusStyle(status)}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original
        const documents = student.enrollmentDocuments || []

        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setViewDetailsId(student.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewDocumentsId(student.id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View documents ({documents.length})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(student.email)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Copy email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {showActions && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setApproveId(student.id)}
                      disabled={isProcessing || student.status === "APPROVED"}
                      className="text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRejectId(student.id)}
                      disabled={isProcessing || student.status === "REJECTED"}
                      className="text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Delete Student
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Pending Student Registrations</h3>
          <p className="text-sm text-muted-foreground">
            Review and approve student registration requests. Students must provide enrollment documents for approval.
          </p>
        </div>
        
        {students.length === 0 ? (
          <AdminEmptyState
            iconName="GraduationCap"
            title="No Pending Students"
            description="There are currently no student registrations awaiting approval. New student registrations will appear here for review."
          />
        ) : (
          <DataTable
            columns={columns}
            data={students}
            searchKey="student"
            searchPlaceholder="Search by email or name..."
          />
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={!!approveId} onOpenChange={() => setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this student registration? This will allow them to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student Registration</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student and all their data. Please provide a reason for deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for deletion..."
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject} 
              disabled={isProcessing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <AlertDialog open={!!viewDetailsId} onOpenChange={() => setViewDetailsId(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Student Details</AlertDialogTitle>
            <AlertDialogDescription>
              Complete information about the student registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            {viewDetailsId && (() => {
              const student = students.find(s => s.id === viewDetailsId)
              if (!student) return null
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-sm text-muted-foreground">
                          {student.firstName} {student.middleName && `${student.middleName} `}{student.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Student ID</p>
                        <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Registration Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Documents Uploaded</p>
                        <p className="text-sm text-muted-foreground">
                          {student.enrollmentDocuments?.length || 0} files
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                          {student.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Documents Dialog */}
      <AlertDialog open={!!viewDocumentsId} onOpenChange={() => setViewDocumentsId(null)}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Student Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Enrollment documents uploaded by the student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {viewDocumentsId && (() => {
              const student = students.find(s => s.id === viewDocumentsId)
              if (!student) return null
              
              const documents = student.enrollmentDocuments || []
              
              if (documents.length === 0) {
                return (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents uploaded</p>
                  </div>
                )
              }
              
              return (
                <div className="space-y-4">
                  {/* Download All Button */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Documents ({documents.length})</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAllDocuments(documents)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">{doc.fileName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>Type: {doc.documentType}</p>
                          <p>Size: {(doc.fileSize / 1024).toFixed(1)} KB</p>
                          <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewDocument(doc)}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Viewer Dialog */}
      <AlertDialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh]">
          <AlertDialogHeader>
            <AlertDialogTitle>Document Viewer</AlertDialogTitle>
            <AlertDialogDescription>
              {viewingDocument?.fileName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {viewingDocument && (
              <div className="space-y-4">
                {/* Document Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">File Name</p>
                    <p className="text-sm text-muted-foreground">{viewingDocument.fileName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Document Type</p>
                    <p className="text-sm text-muted-foreground">{viewingDocument.documentType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">File Size</p>
                    <p className="text-sm text-muted-foreground">{(viewingDocument.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingDocument.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

               {/* Document Preview */}
               <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center">
                 {viewingDocument.fileType?.includes('image') || viewingDocument.fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                   <div className="w-full">
                     <div className="text-center mb-4">
                       <h3 className="text-lg font-medium">Image Preview</h3>
                       <p className="text-sm text-muted-foreground">{viewingDocument.fileName}</p>
                     </div>
                     <div className="flex justify-center">
                       <div className="relative max-w-md max-h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                         {/* Image Preview */}
                         <div className="w-full h-64 flex items-center justify-center">
                           {viewingDocument.fileUrl && viewingDocument.fileUrl.startsWith('/uploads/') ? (
                             <img 
                               src={viewingDocument.fileUrl} 
                               alt="Image Preview" 
                               className="max-w-full max-h-full object-contain rounded"
                               onError={(e) => {
                                 // Fallback to generated preview if real image fails to load
                                 e.currentTarget.src = generateImagePreview(viewingDocument)
                               }}
                             />
                           ) : (
                             <img 
                               src={generateImagePreview(viewingDocument)} 
                               alt="Image Preview" 
                               className="max-w-full max-h-full object-contain rounded"
                             />
                           )}
                         </div>
                         {/* Image Info Overlay */}
                         <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                           <p className="text-xs text-center">
                             {viewingDocument.fileName} • {viewingDocument.fileSize ? (viewingDocument.fileSize / 1024).toFixed(1) + " KB" : "Unknown size"}
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 ) : viewingDocument.fileType?.includes('pdf') || viewingDocument.fileName?.match(/\.pdf$/i) ? (
                   <div className="w-full">
                     <div className="text-center mb-4">
                       <h3 className="text-lg font-medium">PDF Preview</h3>
                       <p className="text-sm text-muted-foreground">{viewingDocument.fileName}</p>
                     </div>
                     <div className="flex justify-center">
                       <div className="relative max-w-md max-h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                         {/* PDF Preview */}
                         <div className="w-full h-64 flex items-center justify-center">
                           <img 
                             src={generatePDFPreview(viewingDocument)} 
                             alt="PDF Preview" 
                             className="max-w-full max-h-full object-contain rounded"
                           />
                         </div>
                         {/* PDF Info Overlay */}
                         <div className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-90 text-white p-2">
                           <p className="text-xs text-center">
                             {viewingDocument.fileName} • {viewingDocument.fileSize ? (viewingDocument.fileSize / 1024).toFixed(1) + " KB" : "Unknown size"}
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="w-full">
                     <div className="text-center mb-4">
                       <h3 className="text-lg font-medium">Document Preview</h3>
                       <p className="text-sm text-muted-foreground">{viewingDocument.fileName}</p>
                     </div>
                     <div className="flex justify-center">
                       <div className="relative max-w-md max-h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                         {/* Simulated Document Preview */}
                         <div className="w-full h-64 bg-white dark:bg-gray-900 p-4">
                           <div className="text-center mb-4">
                             <div className="w-16 h-16 mx-auto mb-4 bg-gray-500 rounded-full flex items-center justify-center">
                               <FileText className="h-8 w-8 text-white" />
                             </div>
                             <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Document</p>
                             <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                               {viewingDocument.fileName}
                             </p>
                           </div>
                           {/* Simulated Document Content */}
                           <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                           </div>
                         </div>
                         {/* Document Info Overlay */}
                         <div className="absolute bottom-0 left-0 right-0 bg-gray-500 bg-opacity-90 text-white p-2">
                           <p className="text-xs text-center">
                             In a real application, this would show the actual document content
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadDocument(viewingDocument)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Simulate print
                      toast({
                        title: "Print Preview",
                        description: `Opening print preview for ${viewingDocument.fileName}`,
                      })
                    }}
                  >
                    Print Document
                  </Button>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
