"use client"

import { useState } from "react"
import { Subject, SchoolYear } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle } from "lucide-react"
import { createEnrollment } from "@/lib/actions/enrollment.actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface EnrollmentFormProps {
  subjects: (Subject & { schoolYear: SchoolYear | null })[]
  studentId: string
  schoolYearId: string
}

export function EnrollmentForm({ subjects, studentId, schoolYearId }: EnrollmentFormProps) {
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleEnroll = async (subjectId: string) => {
    setEnrolling(subjectId)

    const result = await createEnrollment({
      studentId,
      subjectId,
      schoolYearId,
    })

    if (result.success) {
      toast({
        title: "Success",
        description: "Successfully enrolled in subject",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to enroll in subject",
        variant: "destructive",
      })
    }

    setEnrolling(null)
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
            <Button
              className="w-full mt-4"
              onClick={() => handleEnroll(subject.id)}
              disabled={enrolling === subject.id}
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

