
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at?: string;
  updated_at?: string;
}

export function UserProfileManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching profile for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Profile data from DB:', data);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: data.email || user.email || ''
        });
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          email: user.email || ''
        };

        console.log('Creating new profile:', newProfile);

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          console.log('Profile created:', createdProfile);
          setProfile(createdProfile);
          setFormData({
            full_name: createdProfile.full_name || '',
            email: createdProfile.email || ''
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const updateUserProfile = async () => {
    if (!profile || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });

      setIsEditing(false);
      await fetchUserProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <p className="text-slate-600">Please log in to view your profile.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract user name from email or use profile data
  const displayName = formData.full_name || user.email?.split('@')[0] || 'User';
  const displayEmail = formData.email || user.email || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          Manage your account information for {displayEmail}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            disabled={!isEditing}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isEditing}
            placeholder="Enter your email"
          />
          <p className="text-xs text-slate-500">
            Authenticated as: {user.email}
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <Button 
                onClick={updateUserProfile} 
                disabled={isLoading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    full_name: profile.full_name || '',
                    email: profile.email || ''
                  });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Last updated: {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
}
