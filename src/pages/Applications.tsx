import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, Briefcase, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface Application {
    id: string;
    status: string;
    applied_at: string;
    jobs: {
        id: string;
        title: string;
        company: string;
        location: string;
    };
}

const Applications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user) {
                navigate("/auth");
                return;
            }
            setUserId(session.user.id);
        });
    }, [navigate]);

    useEffect(() => {
        if (!userId) return;

        const fetchApplications = async () => {
            try {
                const { data, error } = await supabase
                    .from("applications")
                    .select(`
            id,
            status,
            applied_at,
            jobs (
              id,
              title,
              company,
              location
            )
          `)
                    .eq("user_id", userId)
                    .order("applied_at", { ascending: false });

                if (error) throw error;

                setApplications(data as unknown as Application[]);
            } catch (error) {
                console.error("Error fetching applications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [userId]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "applied": return "bg-blue-500/10 text-blue-500 border-blue-200";
            case "under review": return "bg-yellow-500/10 text-yellow-500 border-yellow-200";
            case "interview": return "bg-purple-500/10 text-purple-500 border-purple-200";
            case "offer": return "bg-green-500/10 text-green-500 border-green-200";
            case "rejected": return "bg-red-500/10 text-red-500 border-red-200";
            default: return "bg-gray-500/10 text-gray-500 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "applied": return <CheckCircle className="w-4 h-4" />;
            case "under review": return <Clock className="w-4 h-4" />;
            case "interview": return <Calendar className="w-4 h-4" />;
            case "offer": return <Briefcase className="w-4 h-4" />;
            case "rejected": return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar isAuthenticated={true} />
                <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar isAuthenticated={true} />

            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Applications</h1>
                    <p className="text-muted-foreground">Track the status of your job applications</p>
                </div>

                {applications.length === 0 ? (
                    <div className="text-center py-16 bg-card border rounded-xl shadow-sm">
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
                        <p className="text-muted-foreground mb-6">Start exploring jobs and apply to your dream role!</p>
                        <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1">
                        {applications.map((app) => (
                            <Card key={app.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl">
                                            {app.jobs?.title || "Unknown Position"}
                                        </CardTitle>
                                        <CardDescription className="text-base font-medium text-primary">
                                            {app.jobs?.company || "Unknown Company"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className={`flex items-center gap-1 px-3 py-1 ${getStatusColor(app.status)}`}>
                                        {getStatusIcon(app.status)}
                                        {app.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {app.jobs?.location || "Remote"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="w-4 h-4" />
                                                Applied on {format(new Date(app.applied_at), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${app.jobs?.id}`)}>
                                            View Job
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

function MapPinIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    )
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}

export default Applications;
