"use client"

import { useState, useEffect } from "react"
import { User, Subject, SchoolYear, Class } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Users, BookOpen, Calendar } from "lucide-react"
import { 
  createTeacherSubjectAssignment, 
  getTeacherAssignments, 
  removeTeacherAssignment,
  updateTeacherAssignment,
  CreateAssignmentInput 
} from "@/lib/actions/assignment.actions"

interface TeacherSubjectAssignmentsProps {
  teachers: User[]
  subjects: Subject[]
  schoolYears: SchoolYear[]
}

interface Assignment extends Class {
  teacher: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  subject: {
    id: string
    code: string
    name: string
    units: number
  }
  schoolYear: {
    id: string
    year: string
    semester: string
  }
  _count: {
    enrollments: number
  }
}

export function TeacherSubjectAssignments({ teachers, subjects, schoolYears }: TeacherSubjectAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<CreateAssignmentInput>({
    teacherId: "",
    subjectId: "",
    schoolYearId: "",
    section: "",
    name: "",
    dayAndTime: "",
    room: "",
    classSize: undefined,
    departmentHead: "",
    vpAcademics: "",
    isIrregular: false
  })

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    setIsLoading(true)
    const result = await getTeacherAssignments()
    if (result.success) {
      setAssignments(result.data)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load assignments",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await createTeacherSubjectAssignment(formData)

    if (result.success) {
      toast({
        title: "Success",
        description: "Subject assigned to teacher successfully"
      })
      setIsDialogOpen(false)
      setFormData({
        teacherId: "",
        subjectId: "",
        schoolYearId: "",
        section: "",
        name: "",
        dayAndTime: "",
        room: "",
        classSize: undefined,
        departmentHead: "",
        vpAcademics: "",
        isIrregular: false
      })
      loadAssignments()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to assign subject",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setFormData({
      teacherId: assignment.teacherId,
      subjectId: assignment.subjectId,
      schoolYearId: assignment.schoolYearId,
      section: assignment.section,
      name: assignment.name,
      dayAndTime: assignment.dayAndTime || "",
      room: assignment.room || "",
      classSize: assignment.classSize || undefined,
      departmentHead: assignment.departmentHead || "",
      vpAcademics: assignment.vpAcademics || "",
      isIrregular: assignment.isIrregular
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAssignment) return

    setIsLoading(true)
    const result = await updateTeacherAssignment(editingAssignment.id, formData)

    if (result.success) {
      toast({
        title: "Success",
        description: "Assignment updated successfully"
      })
      setIsEditDialogOpen(false)
      setEditingAssignment(null)
      loadAssignments()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update assignment",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await removeTeacherAssignment(deleteId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Assignment removed successfully"
      })
      loadAssignments()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to remove assignment",
        variant: "destructive"
      })
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const handleChange = (field: keyof CreateAssignmentInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading && assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Current Assignments</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Subject to Teacher</DialogTitle>
              <DialogDescription>
                Create a new class assignment for a teacher
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherId">Teacher</Label>
                  <Select value={formData.teacherId} onValueChange={(value) => handleChange("teacherId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject</Label>
                  <Select value={formData.subjectId} onValueChange={(value) => handleChange("subjectId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolYearId">School Year</Label>
                  <Select value={formData.schoolYearId} onValueChange={(value) => handleChange("schoolYearId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school year" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolYears.map((schoolYear) => (
                        <SelectItem key={schoolYear.id} value={schoolYear.id}>
                          {schoolYear.year} - {schoolYear.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => handleChange("section", e.target.value)}
                    placeholder="e.g., A, B, C"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Class Name (Optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dayAndTime">Day and Time</Label>
                  <Input
                    id="dayAndTime"
                    value={formData.dayAndTime}
                    onChange={(e) => handleChange("dayAndTime", e.target.value)}
                    placeholder="e.g., TUE - THU (11:30 - 2:30 PM)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => handleChange("room", e.target.value)}
                    placeholder="e.g., C201"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classSize">Class Size</Label>
                  <Input
                    id="classSize"
                    type="number"
                    value={formData.classSize || ""}
                    onChange={(e) => handleChange("classSize", e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Maximum number of students"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isIrregular">Irregular Class</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isIrregular"
                      checked={formData.isIrregular}
                      onCheckedChange={(checked) => handleChange("isIrregular", checked)}
                    />
                    <Label htmlFor="isIrregular">Mark as irregular class</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentHead">Department Head</Label>
                  <Input
                    id="departmentHead"
                    value={formData.departmentHead}
                    onChange={(e) => handleChange("departmentHead", e.target.value)}
                    placeholder="Department head name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vpAcademics">VP for Academics</Label>
                  <Input
                    id="vpAcademics"
                    value={formData.vpAcademics}
                    onChange={(e) => handleChange("vpAcademics", e.target.value)}
                    placeholder="VP for Academics name"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No assignments found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {assignment.subject.code} - {assignment.subject.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Section {assignment.section} • {assignment.schoolYear.year} - {assignment.schoolYear.semester}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(assignment)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(assignment.id)}
                      disabled={assignment._count.enrollments > 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{assignment.teacher.firstName} {assignment.teacher.lastName}</p>
                      <p className="text-xs text-muted-foreground">{assignment.teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{assignment.subject.units} units</p>
                      <p className="text-xs text-muted-foreground">{assignment._count.enrollments} students</p>
                    </div>
                  </div>
                  {assignment.dayAndTime && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{assignment.dayAndTime}</p>
                        {assignment.room && <p className="text-xs text-muted-foreground">Room {assignment.room}</p>}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {assignment.isIrregular && (
                      <Badge variant="secondary">Irregular</Badge>
                    )}
                    {assignment.classSize && (
                      <Badge variant="outline">Max {assignment.classSize}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the class assignment details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  value={formData.section}
                  onChange={(e) => handleChange("section", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Class Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dayAndTime">Day and Time</Label>
                <Input
                  id="edit-dayAndTime"
                  value={formData.dayAndTime}
                  onChange={(e) => handleChange("dayAndTime", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-room">Room</Label>
                <Input
                  id="edit-room"
                  value={formData.room}
                  onChange={(e) => handleChange("room", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-classSize">Class Size</Label>
                <Input
                  id="edit-classSize"
                  type="number"
                  value={formData.classSize || ""}
                  onChange={(e) => handleChange("classSize", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-isIrregular">Irregular Class</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isIrregular"
                    checked={formData.isIrregular}
                    onCheckedChange={(checked) => handleChange("isIrregular", checked)}
                  />
                  <Label htmlFor="edit-isIrregular">Mark as irregular class</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-departmentHead">Department Head</Label>
                <Input
                  id="edit-departmentHead"
                  value={formData.departmentHead}
                  onChange={(e) => handleChange("departmentHead", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vpAcademics">VP for Academics</Label>
                <Input
                  id="edit-vpAcademics"
                  value={formData.vpAcademics}
                  onChange={(e) => handleChange("vpAcademics", e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the teacher-subject assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Removing..." : "Remove Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
