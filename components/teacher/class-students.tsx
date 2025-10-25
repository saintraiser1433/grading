"use client"

import { useState } from "react"
import { Enrollment, User } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Trash2, UserPlus, MoreHorizontal, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { addStudentToClass, removeStudentFromClass } from "@/lib/actions/class.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type EnrollmentWithStudent = Enrollment & { student: User }

interface ClassStudentsProps {
  classId: string
  enrollments: EnrollmentWithStudent[]
}

export function ClassStudents({ classId, enrollments }: ClassStudentsProps) {
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await addStudentToClass(classId, studentId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Student added to class",
      })
      setOpen(false)
      setStudentId("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add student",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return

    const result = await removeStudentFromClass(enrollmentId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Student removed from class",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to remove student",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<EnrollmentWithStudent>[] = [
    {
      accessorKey: "studentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student ID" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.student.studentId || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const student = row.original.student
        return `${student.firstName} ${student.middleName ? student.middleName + " " : ""}${student.lastName}`
      },
      filterFn: (row, id, value) => {
        const student = row.original.student
        const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName}`.toLowerCase()
        return fullName.includes(value.toLowerCase()) || 
               (student.studentId?.toLowerCase().includes(value.toLowerCase()) || false)
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.original.student.email}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const enrollment = row.original

        return (
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
                onClick={() => navigator.clipboard.writeText(enrollment.student.email)}
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRemoveStudent(enrollment.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from Class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (enrollments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No students enrolled yet</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Class</DialogTitle>
              <DialogDescription>
                Enter the student ID to enroll them in this class
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter student ID"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Student"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Class</DialogTitle>
              <DialogDescription>
                Enter the student ID to enroll them in this class
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter student ID"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Student"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={enrollments}
        searchKey="name"
        searchPlaceholder="Search by name or student ID..."
      />
    </div>
  )
}
