"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface GradeTypeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  gradeType?: {
    id: string
    name: string
    description: string | null
    percentage: number
    order: number
    isActive: boolean
  } | null
}

export function GradeTypeFormModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  gradeType 
}: GradeTypeFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    percentage: 0,
    order: 0,
  })
  const { toast } = useToast()

  // Update form data when gradeType prop changes
  useEffect(() => {
    if (gradeType) {
      setFormData({
        name: gradeType.name,
        description: gradeType.description || "",
        percentage: gradeType.percentage,
        order: gradeType.order,
      })
    } else {
      // Reset form for new grade type
      setFormData({
        name: "",
        description: "",
        percentage: 0,
        order: 0,
      })
    }
  }, [gradeType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = gradeType 
        ? `/api/admin/grade-types/${gradeType.id}`
        : "/api/admin/grade-types"
      
      const method = gradeType ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: gradeType 
            ? "Grade type updated successfully" 
            : "Grade type created successfully",
        })
        onClose()
        if (onSuccess) {
          onSuccess()
        }
        // Reset form
        setFormData({
          name: "",
          description: "",
          percentage: 0,
          order: 0,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${gradeType ? 'update' : 'create'} grade type`,
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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === "percentage" || name === "order" ? Number(value) : value,
    }))
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      // Reset form when closing
      setFormData({
        name: "",
        description: "",
        percentage: 0,
        order: 0,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {gradeType ? "Edit Grade Type" : "Add New Grade Type"}
          </DialogTitle>
          <DialogDescription>
            {gradeType 
              ? "Update the grade type information below."
              : "Create a new grade type for your grading criteria."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Quiz, Assignment, Final Exam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage *</Label>
              <Input
                id="percentage"
                name="percentage"
                type="number"
                min="0"
                max="100"
                value={formData.percentage}
                onChange={handleChange}
                placeholder="e.g., 30"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe this grade type..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order *</Label>
            <Input
              id="order"
              name="order"
              type="number"
              min="0"
              value={formData.order}
              onChange={handleChange}
              placeholder="e.g., 1"
              required
            />
            <p className="text-sm text-muted-foreground">
              Lower numbers appear first in the grading criteria
            </p>
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
                ? (gradeType ? "Updating..." : "Creating...") 
                : (gradeType ? "Update Grade Type" : "Create Grade Type")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
