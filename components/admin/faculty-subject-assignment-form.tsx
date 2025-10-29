"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Subject, SchoolYear, DepartmentHead, Department } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { assignSubjectToTeacherManyToMany, removeSubjectFromTeacher } from "@/lib/actions/subject.actions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, User as UserIcon, BookOpen, Plus, X } from "lucide-react"

interface FacultySubjectAssignmentFormProps {
  teachers: User[]
  subjects: (Subject & {
    assignedTeacher: User | null
    subjectAssignments: {
      teacher: User
    }[]
  })[]
  schoolYears: SchoolYear[]
  departmentHeads: DepartmentHead[]
  departments: Department[]
}

export function FacultySubjectAssignmentForm({ teachers, subjects, schoolYears, departmentHeads, departments }: FacultySubjectAssignmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    subjectId: "",
    teacherId: "",
    notes: "",
    startDate: "",
    endDate: "",
    departmentHeadId: "",
    vpAcademics: "HECTOR L. LAVILLES JR., Ph.D.Ed.",
    courseSection: "",
    dayTime: "",
    size: "",
    schoolYearId: "",
    departmentId: "",
  })

  // Get subjects assigned to the selected teacher (many-to-many)
  const teacherSubjects = selectedTeacher 
    ? subjects.filter(subject => 
        subject.subjectAssignments.some(assignment => assignment.teacher.id === selectedTeacher)
      )
    : []
  
  // Get subjects NOT assigned to the selected teacher
  const availableSubjects = selectedTeacher
    ? subjects.filter(subject => 
        !subject.subjectAssignments.some(assignment => assignment.teacher.id === selectedTeacher)
      )
    : subjects

  const handleAssignSubject = async (subjectId: string) => {
    if (!selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select a teacher first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const result = await assignSubjectToTeacherManyToMany(subjectId, selectedTeacher)

    if (result.success) {
      toast({
        title: "Success",
        description: "Subject assigned to teacher successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to assign subject",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleOpenAssignDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setAssignmentForm({
      subjectId: subject.id,
      teacherId: selectedTeacher,
      notes: "",
      startDate: "",
      endDate: "",
      departmentHeadId: "",
      vpAcademics: "HECTOR L. LAVILLES JR., Ph.D.Ed.",
      courseSection: "",
      dayTime: "",
      size: "",
      schoolYearId: "",
      departmentId: "",
    })
    setIsAssignDialogOpen(true)
  }

  const handleAssignWithForm = async () => {
    if (!assignmentForm.subjectId || !assignmentForm.teacherId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const result = await assignSubjectToTeacherManyToMany(assignmentForm.subjectId, assignmentForm.teacherId)

    if (result.success) {
      toast({
        title: "Success",
        description: "Subject assigned to teacher successfully",
      })
      setIsAssignDialogOpen(false)
      setSelectedSubject(null)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to assign subject",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleRemoveAssignment = async (subjectId: string) => {
    setIsLoading(true)

    const result = await removeSubjectFromTeacher(subjectId, selectedTeacher)

    if (result.success) {
      toast({
        title: "Success",
        description: "Subject assignment removed successfully",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to remove assignment",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Teacher Selection */}
      <div className="space-y-2">
        <Label htmlFor="teacher">Select Teacher</Label>
        <Select
          value={selectedTeacher}
          onValueChange={setSelectedTeacher}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a teacher to view their assignments" />
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

      {selectedTeacher ? (
        <>
          {/* Selected Teacher Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {teachers.find(t => t.id === selectedTeacher)?.firstName} {teachers.find(t => t.id === selectedTeacher)?.lastName}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {teachers.find(t => t.id === selectedTeacher)?.email}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Assigned Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Assigned Subjects ({teacherSubjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacherSubjects.length > 0 ? (
                  <div className="space-y-2">
                    {teacherSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{subject.code}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{subject.name}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAssignment(subject.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No subjects assigned to this teacher
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Available Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Available Subjects ({availableSubjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableSubjects.length > 0 ? (
                  <div className="space-y-2">
                    {availableSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{subject.code}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{subject.name}</div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={isAssignDialogOpen && selectedSubject?.id === subject.id} onOpenChange={(open) => {
                            setIsAssignDialogOpen(open)
                            if (!open) setSelectedSubject(null)
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => handleOpenAssignDialog(subject)}
                                disabled={isLoading}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Assign Subject to Teacher</DialogTitle>
                              <DialogDescription>
                                Assign <strong>{subject.code} - {subject.name}</strong> to a teacher with comprehensive details.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              {/* Subject Information */}
                              <div className="space-y-2">
                                <Label>Subject Code</Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="font-medium">{subject.code}</div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Description</Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{subject.name}</div>
                                </div>
                              </div>

                              {/* Teacher Selection */}
                              <div className="space-y-2">
                                <Label htmlFor="teacher">Instructor *</Label>
                                <Select
                                  value={assignmentForm.teacherId}
                                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, teacherId: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an instructor" />
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

                              {/* Department Head */}
                              <div className="space-y-2">
                                <Label htmlFor="departmentHead">Department Head</Label>
                                <Select
                                  value={assignmentForm.departmentHeadId}
                                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, departmentHeadId: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department head" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departmentHeads.map((deptHead) => (
                                      <SelectItem key={deptHead.id} value={deptHead.id}>
                                        {deptHead.name} {deptHead.title && `(${deptHead.title})`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* VP for Academics */}
                              <div className="space-y-2">
                                <Label htmlFor="vpAcademics">VP for Academics</Label>
                                <Input
                                  id="vpAcademics"
                                  value={assignmentForm.vpAcademics}
                                  readOnly
                                  className="bg-gray-50 dark:bg-gray-800"
                                />
                              </div>

                              {/* Course & Section */}
                              <div className="space-y-2">
                                <Label htmlFor="courseSection">Course & Section</Label>
                                <Input
                                  id="courseSection"
                                  placeholder="e.g., BSCS 4 - SECTION A"
                                  value={assignmentForm.courseSection}
                                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, courseSection: e.target.value }))}
                                />
                              </div>

                              {/* Day & Time */}
                              <div className="space-y-2">
                                <Label htmlFor="dayTime">Day & Time</Label>
                                <Input
                                  id="dayTime"
                                  placeholder="e.g., TUE - THU (11:30 - 2:30 PM | C201)"
                                  value={assignmentForm.dayTime}
                                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, dayTime: e.target.value }))}
                                />
                              </div>

                              {/* Size */}
                              <div className="space-y-2">
                                <Label htmlFor="size">Size</Label>
                                <Input
                                  id="size"
                                  type="number"
                                  placeholder="e.g., 39"
                                  value={assignmentForm.size}
                                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, size: e.target.value }))}
                                />
                              </div>

                              {/* School Year */}
                              <div className="space-y-2">
                                <Label htmlFor="schoolYear">School Year</Label>
                                <Select
                                  value={assignmentForm.schoolYearId}
                                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, schoolYearId: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select school year" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {schoolYears.map((schoolYear) => (
                                      <SelectItem key={schoolYear.id} value={schoolYear.id}>
                                        {schoolYear.year} • {schoolYear.semester}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Department */}
                              <div className="space-y-2">
                                <Label htmlFor="departmentId">Department</Label>
                                <Select
                                  value={assignmentForm.departmentId}
                                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, departmentId: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map((department) => (
                                      <SelectItem key={department.id} value={department.id}>
                                        {department.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>


                              {/* Date Range */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="startDate">Start Date</Label>
                                  <Input
                                    id="startDate"
                                    type="date"
                                    value={assignmentForm.startDate}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, startDate: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="endDate">End Date</Label>
                                  <Input
                                    id="endDate"
                                    type="date"
                                    value={assignmentForm.endDate}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, endDate: e.target.value }))}
                                  />
                                </div>
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Additional notes about this assignment..."
                                  value={assignmentForm.notes}
                                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsAssignDialogOpen(false)}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAssignWithForm}
                                disabled={isLoading || !assignmentForm.teacherId}
                              >
                                {isLoading ? "Assigning..." : "Assign Subject"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No available subjects for this teacher
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select a Teacher
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Choose a teacher from the dropdown above to view and manage their subject assignments
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary - Only show when teacher is selected */}
      {selectedTeacher && (
        <div className="flex gap-4">
          <Badge variant="outline">
            Total Subjects: {subjects.length}
          </Badge>
          <Badge variant="outline">
            Total Assignments: {subjects.reduce((total, s) => total + s.subjectAssignments.length, 0)}
          </Badge>
          <Badge variant="outline">
            Available: {availableSubjects.length}
          </Badge>
        </div>
      )}
    </div>
  )
}
