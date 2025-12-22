
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User } from "lucide-react";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: "",
        headline: "",
        bio: "",
        linkedin_url: "",
        website_url: ""
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
                fetchProfile(session.user.id);
            }
        });
    }, []);

    const fetchProfile = async (uid: string) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", uid)
            .single();

        if (data) {
            setFormData({
                full_name: data.full_name || "",
                headline: data.headline || "",
                bio: data.bio || "",
                linkedin_url: data.linkedin_url || "",
                website_url: data.website_url || ""
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);

        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                ...formData,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            toast.error("Failed to save profile");
        } else {
            toast.success("Profile updated successfully!");
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 flex justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background">
            <Navbar isAuthenticated={true} />
            <main className="pt-24 pb-12 px-4 container mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-6 w-6 text-primary" />
                            <CardTitle>Edit Profile</CardTitle>
                        </div>
                        <CardDescription>Update your personal information and portfolio links</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Headline</label>
                            <Input
                                value={formData.headline}
                                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                placeholder="Software Engineer | React Specialist"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bio</label>
                            <Textarea
                                value={formData.bio}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                className="h-32"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">LinkedIn URL</label>
                                <Input
                                    value={formData.linkedin_url}
                                    onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Website / Portfolio</label>
                                <Input
                                    value={formData.website_url}
                                    onChange={e => setFormData({ ...formData, website_url: e.target.value })}
                                    placeholder="https://myportfolio.com"
                                />
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
