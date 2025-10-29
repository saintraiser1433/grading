"use client"

import { useState } from "react"
import { Subject, SchoolYear } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle, AlertCircle } from "lucide-react"
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

interface EnrollmentFormProps {
  subjects: (Subject & { schoolYear: SchoolYear | null })[]
  studentId: string
  schoolYearId: string
}

export function EnrollmentForm({ subjects, studentId, schoolYearId }: EnrollmentFormProps) {
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [confirmingSubject, setConfirmingSubject] = useState<Subject | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleEnroll = async (subject: Subject) => {
    setEnrolling(subject.id)

    const result = await createEnrollment({
      studentId,
      subjectId: subject.id,
      schoolYearId,
      status: "PENDING",
    })

    if (result.success) {
      toast({
        title: "✅ Enrollment Request Submitted",
        description: `You have successfully requested enrollment in ${subject.code} - ${subject.name}. Your request is pending teacher approval.`,
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
    setConfirmingSubject(null)
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
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full mt-4"
                  disabled={enrolling === subject.id}
                  onClick={() => setConfirmingSubject(subject)}
                >
                  {enrolling === subject.id ? (
                    "Enrolling..."
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
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
                    Are you sure you want to enroll in <strong>{subject.code} - {subject.name}</strong>?
                    <br /><br />
                    <span className="text-sm text-gray-600">
                      • This will submit an enrollment request that requires teacher approval
                      <br />
                      • You will be notified once your enrollment is approved or rejected
                      <br />
                      • You can view your enrollment status in your dashboard
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmingSubject(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleEnroll(subject)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Enrollment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

