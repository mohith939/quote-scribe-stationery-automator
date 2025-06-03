
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAppsScriptIntegration } from "./GoogleAppsScriptIntegration";
import { UserProfileManager } from "../auth/UserProfileManager";
import { Settings as SettingsIcon, User, Code } from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings & Configuration
          </CardTitle>
          <CardDescription>
            Manage your account and integrations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* User Profile Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </h3>
        <UserProfileManager />
      </div>

      {/* Google Apps Script Integration Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Code className="h-5 w-5" />
          Google Apps Script Integration
        </h3>
        <GoogleAppsScriptIntegration />
      </div>
    </div>
  );
}

export default Settings;
