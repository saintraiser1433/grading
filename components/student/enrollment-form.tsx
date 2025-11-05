"use client"

import { useState } from "react"
import { Subject, SchoolYear, Class, User as PrismaUser } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle, AlertCircle, Clock, Users, User } from "lucide-react"
import { createEnrollment } from "@/lib/actions/enrollment.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type SubjectWithClasses = Subject & { 
  schoolYear: SchoolYear | null
  subjectAssignments: Array<{
    teacher: Pick<PrismaUser, "id" | "firstName" | "lastName" | "email">
  }>
  classes: Array<Class & {
    teacher: Pick<PrismaUser, "id" | "firstName" | "lastName">
  }>
}

interface EnrollmentFormProps {
  subjects: SubjectWithClasses[]
  studentId: string
  schoolYearId: string
  enrolledClassIds?: Set<string>
}

export function EnrollmentForm({ subjects, studentId, schoolYearId, enrolledClassIds = new Set() }: EnrollmentFormProps) {
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [confirmingClass, setConfirmingClass] = useState<{subject: SubjectWithClasses, classItem: Class & {teacher: Pick<PrismaUser, "id" | "firstName" | "lastName">}} | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  // Ensure enrolledClassIds is a Set
  const enrolledClassIdsSet = enrolledClassIds instanceof Set ? enrolledClassIds : new Set()

  const handleEnroll = async (subject: SubjectWithClasses, classItem: Class & {teacher: Pick<PrismaUser, "id" | "firstName" | "lastName">}) => {
    setEnrolling(classItem.id)

    const result = await createEnrollment({
      studentId,
      subjectId: subject.id,
      classId: classItem.id,
      schoolYearId,
      status: "PENDING",
    })

    if (result.success) {
      toast({
        title: "✅ Enrollment Request Submitted",
        description: `You have successfully requested enrollment in ${subject.code} - ${subject.name} (${classItem.section}). Your request is pending teacher approval.`,
        duration: 5000,
      })
      router.refresh()
    } else {
      toast({
        title: "❌ Enrollment Failed",
        description: result.error || "Failed to enroll in subject. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }

    setEnrolling(null)
    setConfirmingClass(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {subjects.map((subject) => (
        <Card key={subject.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{subject.code}</h3>
                </div>
                <p className="text-gray-900 mt-2">{subject.name}</p>
                {subject.description && (
                  <p className="text-sm text-gray-500 mt-1">{subject.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline">{subject.units} units</Badge>
                  {subject.isOpen && (
                    <Badge className="bg-green-600">Open</Badge>
                  )}
                </div>

                {/* Display Classes */}
                {subject.classes.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Available Sections (Click to enroll):
                    </p>
                    {subject.classes.map((classItem) => (
                      <div 
                        key={classItem.id} 
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {classItem.name}
                              </span>
                              {classItem.section && (
                                <Badge variant="outline" className="text-xs">
                                  Section {classItem.section}
                                </Badge>
                              )}
                            </div>
                            {classItem.dayAndTime && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>{classItem.dayAndTime}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <User className="h-3 w-3" />
                              <span>
                                {classItem.teacher.firstName} {classItem.teacher.lastName}
                              </span>
                            </div>
                          </div>
                          {enrolledClassIdsSet.has(classItem.id) ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Enrolled
                            </Badge>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  disabled={enrolling === classItem.id}
                                  onClick={() => setConfirmingClass({subject, classItem})}
                                >
                                  {enrolling === classItem.id ? (
                                    "Enrolling..."
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Enroll
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-blue-600" />
                                  Confirm Enrollment
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                  Are you sure you want to enroll in:
                                  <br /><br />
                                  <strong>{subject.code} - {subject.name}</strong>
                                  <br />
                                  <strong>Section {classItem.section}</strong> with <strong>{classItem.teacher.firstName} {classItem.teacher.lastName}</strong>
                                  {classItem.dayAndTime && (
                                    <>
                                      <br />
                                      <span className="text-sm">{classItem.dayAndTime}</span>
                                    </>
                                  )}
                                  <br /><br />
                                  <span className="text-sm text-gray-600">
                                    • This will submit an enrollment request that requires teacher approval
                                    <br />
                                    • You will be notified once your enrollment is approved or rejected
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setConfirmingClass(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleEnroll(subject, classItem)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirm Enrollment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No sections available yet. Please check back later.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

