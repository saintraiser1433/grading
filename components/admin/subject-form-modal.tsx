"use client"

import { useState, useEffect } from "react"
import { SchoolYear, Subject } from "@prisma/client"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createSubject, updateSubject } from "@/lib/actions/subject.actions"
import type { CreateSubjectInput } from "@/lib/schemas"
import { useToast } from "@/hooks/use-toast"

interface SubjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  subject?: Subject | null
  schoolYears: SchoolYear[]
}

export function SubjectFormModal({ 
  isOpen, 
  onClose, 
  subject,
  schoolYears 
}: SubjectFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    units: 3,
    isOpen: false,
    schoolYearId: "",
  })
  const { toast } = useToast()

  // Populate form when editing
  useEffect(() => {
    if (subject) {
      setFormData({
        code: subject.code,
        name: subject.name,
        description: subject.description || "",
        units: subject.units,
        isOpen: subject.isOpen,
        schoolYearId: subject.schoolYearId || "",
      })
    } else {
      // Reset form for new subject
      setFormData({
        code: "",
        name: "",
        description: "",
        units: 3,
        isOpen: false,
        schoolYearId: "",
      })
    }
  }, [subject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data: CreateSubjectInput = {
        ...formData,
        schoolYearId: formData.schoolYearId || undefined,
      }

      const result = subject 
        ? await updateSubject(subject.id, data)
        : await createSubject(data)

      if (result.success) {
        toast({
          title: "Success",
          description: subject 
            ? "Subject updated successfully" 
            : "Subject created successfully",
        })
        onClose()
        // Reset form
        setFormData({
          code: "",
          name: "",
          description: "",
          units: 3,
          isOpen: false,
          schoolYearId: "",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${subject ? 'update' : 'create'} subject`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      // Reset form when closing
      setFormData({
        code: "",
        name: "",
        description: "",
        units: 3,
        isOpen: false,
        schoolYearId: "",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          <DialogDescription>
            {subject ? "Edit the subject details." : "Create a new subject for your course offerings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (subject ? "Updating..." : "Creating...") 
                : (subject ? "Update Subject" : "Create Subject")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
