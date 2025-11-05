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

interface FacultySubjectAssignmentFormProps {
  teachers: User[]
  subjects: (Subject & {
    assignedTeacher: User | null
    subjectAssignments: {
      teacher: User
      schoolYearId: string | null
    }[]
    classes?: {
      id: string
      name: string
      section: string
      dayAndTime: string | null
      teacherId: string
      schoolYearId: string
      teacher: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
      }
      schoolYear: {
        id: string
        year: string
        semester: string
      }
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
    schoolYearId: "",
    departmentId: "",
  })
  // Array of schedules (course, section, dayTime, size)
  const [schedules, setSchedules] = useState<Array<{
    course: string
    section: string
    dayTime: string
    size: string
  }>>([{ course: "", section: "", dayTime: "", size: "" }])
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState<string>("all")
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null)

  // Get subjects assigned to the selected teacher (many-to-many), filtered by school year
  const teacherSubjects = selectedTeacher 
    ? subjects.filter(subject => {
        const hasAssignment = subject.subjectAssignments.some(assignment => 
          assignment.teacher.id === selectedTeacher &&
          (selectedSchoolYearFilter === "all" || assignment.schoolYearId === selectedSchoolYearFilter || subject.schoolYearId === selectedSchoolYearFilter)
        )
        return hasAssignment
      })
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
      schoolYearId: "",
      departmentId: "",
    })
    // Reset schedules to one empty schedule
    setSchedules([{ course: "", section: "", dayTime: "", size: "" }])
    setIsAssignDialogOpen(true)
  }

  const addSchedule = () => {
    setSchedules([...schedules, { course: "", section: "", dayTime: "", size: "" }])
  }

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index))
    }
  }

  const updateSchedule = (index: number, field: string, value: string) => {
    const updated = [...schedules]
    updated[index] = { ...updated[index], [field]: value }
    setSchedules(updated)
  }

  const handleAssignWithForm = async () => {
    if (!assignmentForm.subjectId || !assignmentForm.teacherId || !assignmentForm.schoolYearId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Subject, Teacher, and School Year)",
        variant: "destructive",
      })
      return
    }

    // Validate that at least one schedule has course and section
    const validSchedules = schedules.filter(s => s.course.trim() && s.section.trim())
    if (validSchedules.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one schedule with Course and Section",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Create assignments for each schedule
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const schedule of validSchedules) {
      const result = await assignSubjectToTeacherManyToMany(
        assignmentForm.subjectId, 
        assignmentForm.teacherId,
        schedule.course,
        schedule.section,
        schedule.dayTime,
        schedule.size,
        assignmentForm.schoolYearId,
        assignmentForm.departmentHeadId,
        assignmentForm.departmentId
      )

      if (result.success) {
        successCount++
      } else {
        errorCount++
        errors.push(result.error || "Failed to assign schedule")
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `Successfully assigned ${successCount} schedule(s)${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
      })
      setIsAssignDialogOpen(false)
      setSelectedSubject(null)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: errors[0] || "Failed to assign subject",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleRemoveAssignment = async (subjectId: string) => {
    setIsLoading(true)
    setDeleteSubjectId(null) // Close dialog

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

          {/* School Year Filter */}
          <div className="space-y-2">
            <Label htmlFor="schoolYearFilter">Filter by Academic Year</Label>
            <Select
              value={selectedSchoolYearFilter}
              onValueChange={setSelectedSchoolYearFilter}
              disabled={isLoading}
            >
              <SelectTrigger id="schoolYearFilter">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {schoolYears.map((sy) => (
                  <SelectItem key={sy.id} value={sy.id}>
                    {sy.year} - {sy.semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    {teacherSubjects.map((subject) => {
                      // Find the class for this subject and teacher
                      const assignment = subject.subjectAssignments.find(
                        (a) => a.teacher.id === selectedTeacher &&
                        (selectedSchoolYearFilter === "all" || a.schoolYearId === selectedSchoolYearFilter || subject.schoolYearId === selectedSchoolYearFilter)
                      )
                      
                      // Find matching class for this assignment
                      const matchingClass = subject.classes?.find(
                        (cls) => cls.teacherId === selectedTeacher &&
                        (assignment?.schoolYearId ? cls.schoolYearId === assignment.schoolYearId : true)
                      )
                      
                      return (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{subject.code} - {subject.name}</div>
                            {matchingClass && (
                              <div className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Course:</span> {matchingClass.name}
                                  {matchingClass.section && ` • Section: ${matchingClass.section}`}
                                </div>
                                {matchingClass.dayAndTime && (
                                  <div>
                                    <span className="font-medium">Time:</span> {matchingClass.dayAndTime}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Instructor:</span> {matchingClass.teacher.firstName} {matchingClass.teacher.lastName}
                                </div>
                              </div>
                            )}
                            {!matchingClass && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                Class details not available
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteSubjectId(subject.id)}
                            disabled={isLoading}
                            className="ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
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

                              {/* Schedules Section */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-base font-semibold">Schedules *</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSchedule}
                                    disabled={isLoading}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Schedule
                                  </Button>
                                </div>
                                <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                  {schedules.map((schedule, index) => (
                                    <div key={index} className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Schedule {index + 1}</Label>
                                        {schedules.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSchedule(index)}
                                            disabled={isLoading}
                                          >
                                            <X className="h-4 w-4 text-red-500" />
                                          </Button>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        {/* Course */}
                                        <div className="space-y-2">
                                          <Label htmlFor={`course-${index}`}>Course *</Label>
                                          <Input
                                            id={`course-${index}`}
                                            placeholder="e.g., BSCS 4"
                                            value={schedule.course}
                                            onChange={(e) => updateSchedule(index, "course", e.target.value)}
                                            disabled={isLoading}
                                          />
                                        </div>

                                        {/* Section */}
                                        <div className="space-y-2">
                                          <Label htmlFor={`section-${index}`}>Section *</Label>
                                          <Input
                                            id={`section-${index}`}
                                            placeholder="e.g., A, B, C"
                                            value={schedule.section}
                                            onChange={(e) => updateSchedule(index, "section", e.target.value)}
                                            disabled={isLoading}
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        {/* Day & Time */}
                                        <div className="space-y-2">
                                          <Label htmlFor={`dayTime-${index}`}>Day & Time</Label>
                                          <Input
                                            id={`dayTime-${index}`}
                                            placeholder="e.g., TUE - THU (11:30 - 2:30 PM | C201)"
                                            value={schedule.dayTime}
                                            onChange={(e) => updateSchedule(index, "dayTime", e.target.value)}
                                            disabled={isLoading}
                                          />
                                        </div>

                                        {/* Size */}
                                        <div className="space-y-2">
                                          <Label htmlFor={`size-${index}`}>Size</Label>
                                          <Input
                                            id={`size-${index}`}
                                            type="number"
                                            placeholder="e.g., 39"
                                            value={schedule.size}
                                            onChange={(e) => updateSchedule(index, "size", e.target.value)}
                                            disabled={isLoading}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* School Year */}
                              <div className="space-y-2">
                                <Label htmlFor="schoolYear">School Year *</Label>
                                <Select
                                  value={assignmentForm.schoolYearId}
                                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, schoolYearId: value }))}
                                  required
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteSubjectId !== null} onOpenChange={() => setDeleteSubjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove Subject Assignment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this subject assignment? This action will:
              <br /><br />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                • Remove the subject assignment from the teacher
                <br />
                • Delete all associated classes (if no students are enrolled)
                <br />
                • This action cannot be undone
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubjectId && handleRemoveAssignment(deleteSubjectId)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Removing..." : "Remove Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
