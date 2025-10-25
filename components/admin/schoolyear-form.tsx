"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { createSchoolYear } from "@/lib/actions/schoolyear.actions"
import type { CreateSchoolYearInput } from "@/lib/schemas"
import { useToast } from "@/hooks/use-toast"

export function SchoolYearForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    year: "",
    semester: "FIRST" as "FIRST" | "SECOND" | "SUMMER",
    startDate: "",
    endDate: "",
    isActive: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data: CreateSchoolYearInput = {
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    }

    const result = await createSchoolYear(data)

    if (result.success) {
      toast({
        title: "Success",
        description: "School year created successfully",
      })
      router.push("/admin/school-years")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create school year",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="year">Academic Year *</Label>
          <Input
            id="year"
            name="year"
            value={formData.year}
            onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
            placeholder="e.g., 2024-2025"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Semester *</Label>
          <Select
            value={formData.semester}
            onValueChange={(value: "FIRST" | "SECOND" | "SUMMER") =>
              setFormData((prev) => ({ ...prev, semester: value }))
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIRST">First Semester</SelectItem>
              <SelectItem value="SECOND">Second Semester</SelectItem>
              <SelectItem value="SUMMER">Summer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="isActive">Set as Active School Year</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
              disabled={isLoading}
            />
            <span className="text-sm text-gray-500">
              {formData.isActive ? "This will be set as the active school year" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create School Year"}
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

