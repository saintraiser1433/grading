import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getAllGlobalSettings } from "@/lib/actions/globalsettings.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/admin/settings-form"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const settingsResult = await getAllGlobalSettings()
  const settings = settingsResult.success ? settingsResult.data || [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure global system settings
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Settings</CardTitle>
            <CardDescription>
              Configure academic-related global settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
