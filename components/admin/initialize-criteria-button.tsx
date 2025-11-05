"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { initializeCriteriaForExistingClasses } from "@/lib/actions/class.actions"

export function InitializeCriteriaButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleInitialize = async () => {
    if (!confirm("This will initialize grading criteria for all existing classes that don't have criteria yet. Continue?")) {
      return
    }

    setIsLoading(true)
    try {
      const result = await initializeCriteriaForExistingClasses()
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Initialized criteria for ${result.data?.initialized} classes. ${result.data?.skipped} classes already had criteria.`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to initialize criteria",
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

  return (
    <Button
      onClick={handleInitialize}
      disabled={isLoading}
      variant="outline"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Initializing..." : "Initialize Existing Classes"}
    </Button>
  )
}


