
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAppsScriptIntegration } from "./GoogleAppsScriptIntegration";
import { GmailSettings } from "./GmailSettings";
import { UserProfileManager } from "../auth/UserProfileManager";
import { Settings as SettingsIcon, User, Mail, Code } from "lucide-react";

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
            Manage your account, integrations, and email automation settings
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

      {/* Gmail Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Configuration
        </h3>
        <GmailSettings />
      </div>
    </div>
  );
}

export default Settings;
