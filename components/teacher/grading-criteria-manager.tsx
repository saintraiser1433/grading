"use client"

import { useState } from "react"
import { GradingCriteria } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  createGradingCriteria,
  updateGradingCriteria,
  deleteGradingCriteria,
} from "@/lib/actions/grade.actions"
import type { CreateGradingCriteriaInput } from "@/lib/schemas"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface GradingCriteriaManagerProps {
  classId: string
  criteria: GradingCriteria[]
}

export function GradingCriteriaManager({ classId, criteria }: GradingCriteriaManagerProps) {
  const [open, setOpen] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<GradingCriteria | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    percentage: 0,
    isMidterm: true,
    order: 0,
  })

  const handleOpenDialog = (criteria?: GradingCriteria) => {
    if (criteria) {
      setEditingCriteria(criteria)
      setFormData({
        name: criteria.name,
        percentage: criteria.percentage,
        isMidterm: criteria.isMidterm,
        order: criteria.order,
      })
    } else {
      setEditingCriteria(null)
      setFormData({
        name: "",
        percentage: 0,
        isMidterm: true,
        order: 0,
      })
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (editingCriteria) {
      const result = await updateGradingCriteria(editingCriteria.id, formData)
      if (result.success) {
        toast({
          title: "Success",
          description: "Grading criteria updated",
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update criteria",
          variant: "destructive",
        })
      }
    } else {
      const data: CreateGradingCriteriaInput = {
        ...formData,
        classId,
      }
      const result = await createGradingCriteria(data)
      if (result.success) {
        toast({
          title: "Success",
          description: "Grading criteria created",
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create criteria",
          variant: "destructive",
        })
      }
    }

    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this criteria?")) return

    const result = await deleteGradingCriteria(id)
    if (result.success) {
      toast({
        title: "Success",
        description: "Grading criteria deleted",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete criteria",
        variant: "destructive",
      })
    }
  }

  const midtermCriteria = criteria.filter((c) => c.isMidterm)
  const finalCriteria = criteria.filter((c) => !c.isMidterm)

  const midtermTotal = midtermCriteria.reduce((sum, c) => sum + c.percentage, 0)
  const finalTotal = finalCriteria.reduce((sum, c) => sum + c.percentage, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Criteria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCriteria ? "Edit" : "Add"} Grading Criteria
              </DialogTitle>
              <DialogDescription>
                Define the grading criteria and percentage weight
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Criteria Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Quizzes"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage (%) *</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.percentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      percentage: parseFloat(e.target.value),
                    }))
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value),
                    }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isMidterm">Period</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isMidterm"
                    checked={formData.isMidterm}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isMidterm: checked }))
                    }
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-500">
                    {formData.isMidterm ? "Midterm" : "Final"}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Midterm Criteria */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Midterm Criteria</h3>
        {midtermCriteria.length === 0 ? (
          <p className="text-gray-500 text-sm">No midterm criteria defined</p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criteria Name</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {midtermCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell className="font-medium">{criteria.name}</TableCell>
                      <TableCell>{criteria.percentage}%</TableCell>
                      <TableCell>{criteria.order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(criteria)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(criteria.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell
                      className={
                        midtermTotal === 100
                          ? "font-bold text-green-600"
                          : "font-bold text-red-600"
                      }
                    >
                      {midtermTotal}%
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {midtermTotal !== 100 && (
              <p className="text-sm text-red-600">
                Warning: Total percentage must equal 100%
              </p>
            )}
          </>
        )}
      </div>

      {/* Final Criteria */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Final Criteria</h3>
        {finalCriteria.length === 0 ? (
          <p className="text-gray-500 text-sm">No final criteria defined</p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criteria Name</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell className="font-medium">{criteria.name}</TableCell>
                      <TableCell>{criteria.percentage}%</TableCell>
                      <TableCell>{criteria.order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(criteria)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(criteria.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell
                      className={
                        finalTotal === 100
                          ? "font-bold text-green-600"
                          : "font-bold text-red-600"
                      }
                    >
                      {finalTotal}%
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {finalTotal !== 100 && (
              <p className="text-sm text-red-600">
                Warning: Total percentage must equal 100%
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

