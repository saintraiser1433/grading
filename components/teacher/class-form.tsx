"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Subject, SchoolYear } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClass } from "@/lib/actions/class.actions"
import type { CreateClassInput } from "@/lib/schemas"
import { useToast } from "@/hooks/use-toast"

interface ClassFormProps {
  subjects: Subject[]
  schoolYears: SchoolYear[]
  teacherId: string
  initialSubjectId?: string
}

export function ClassForm({ subjects, schoolYears, teacherId, initialSubjectId }: ClassFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    isIrregular: false,
    subjectId: initialSubjectId || "",
    schoolYearId: schoolYears.find(sy => sy.isActive)?.id || "",
  })

  // Update subjectId when initialSubjectId changes
  useEffect(() => {
    if (initialSubjectId) {
      setFormData(prev => ({ ...prev, subjectId: initialSubjectId }))
    }
  }, [initialSubjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data: CreateClassInput = {
      ...formData,
      teacherId,
    }

    const result = await createClass(data)

    if (result.success) {
      toast({
        title: "Success",
        description: "Class created successfully",
      })
      router.push("/teacher/classes")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create class",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Class Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., BSIT 3A"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section">Section *</Label>
          <Input
            id="section"
            name="section"
            value={formData.section}
            onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
            placeholder="e.g., A"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="subjectId">Subject *</Label>
          <Select
            value={formData.subjectId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, subjectId: value }))
            }
            disabled={isLoading}
          >
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="schoolYearId">School Year *</Label>
          <Select
            value={formData.schoolYearId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, schoolYearId: value }))
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={sy.id}>
                  {sy.year} - {sy.semester} Semester
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="isIrregular">Irregular Section</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="isIrregular"
              checked={formData.isIrregular}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isIrregular: checked }))
              }
              disabled={isLoading}
            />
            <span className="text-sm text-gray-500">
              {formData.isIrregular ? "This is an irregular section" : "Regular section"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Class"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

