"use client"

import { useState, useEffect } from "react"
import { GlobalSettings } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { setVpAcademics } from "@/lib/actions/globalsettings.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"

interface SettingsFormProps {
  settings: GlobalSettings[]
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [vpAcademics, setVpAcademicsValue] = useState("")

  useEffect(() => {
    const vpSetting = settings.find(s => s.key === "VP_ACADEMICS")
    setVpAcademicsValue(vpSetting?.value || "HECTOR L. LAVILLES JR., Ph.D.Ed.")
  }, [settings])

  const handleSaveVpAcademics = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await setVpAcademics(vpAcademics)
      if (result.success) {
        toast({
          title: "Success",
          description: "VP for Academics updated successfully",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vice President for Academics</CardTitle>
          <CardDescription>
            Set the global VP for Academics name that will be used in subject assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveVpAcademics} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vpAcademics">VP for Academics Name</Label>
              <Input
                id="vpAcademics"
                placeholder="e.g., HECTOR L. LAVILLES JR., Ph.D.Ed."
                value={vpAcademics}
                onChange={(e) => setVpAcademicsValue(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save VP for Academics"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



