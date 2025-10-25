"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SchoolYear } from "@prisma/client"
import { Button } from "@/components/ui/button"
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
import { createSubject } from "@/lib/actions/subject.actions"
import type { CreateSubjectInput } from "@/lib/schemas"
import { useToast } from "@/hooks/use-toast"

interface SubjectFormProps {
  schoolYears: SchoolYear[]
}

export function SubjectForm({ schoolYears }: SubjectFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    units: 3,
    isOpen: false,
    schoolYearId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data: CreateSubjectInput = {
      ...formData,
      schoolYearId: formData.schoolYearId || undefined,
    }

    const result = await createSubject(data)

    if (result.success) {
      toast({
        title: "Success",
        description: "Subject created successfully",
      })
      router.push("/admin/subjects")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create subject",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Subject Code *</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., CS101"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="units">Units *</Label>
          <Input
            id="units"
            name="units"
            type="number"
            min="1"
            max="5"
            value={formData.units}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, units: parseInt(e.target.value) }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Subject Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Introduction to Computer Science"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Subject description..."
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolYearId">School Year (Optional)</Label>
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

        <div className="space-y-2">
          <Label htmlFor="isOpen">Open for Enrollment</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="isOpen"
              checked={formData.isOpen}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isOpen: checked }))
              }
              disabled={isLoading}
            />
            <span className="text-sm text-gray-500">
              {formData.isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Subject"}
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

