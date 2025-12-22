import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { simulateScraping, ScrapedJob } from '@/utils/jobScraper';
import { toast } from "sonner";
import { Loader2, Search, Download } from 'lucide-react';

interface JobImportModalProps {
    onImport: (jobs: ScrapedJob[]) => void;
}

export function JobImportModal({ onImport }: JobImportModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [platform, setPlatform] = useState('Indeed');
    const [keyword, setKeyword] = useState('React Developer');

    const handleImport = async () => {
        setLoading(true);
        setProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 300);

        try {
            const jobs = await simulateScraping(platform, keyword);

            clearInterval(interval);
            setProgress(100);

            // Small delay to show 100%
            setTimeout(() => {
                onImport(jobs);
                toast.success(`Successfully imported ${jobs.length} jobs from ${platform}`);
                setOpen(false);
                setLoading(false);
                setProgress(0);
            }, 500);

        } catch (error) {
            clearInterval(interval);
            console.error("Scraping failed", error);
            toast.error("Failed to import jobs. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Import Jobs
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import External Jobs</DialogTitle>
                    <DialogDescription>
                        Scrape job postings from external platforms to add to your board.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">Platform</label>
                        <Select value={platform} onValueChange={setPlatform}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Indeed">Indeed</SelectItem>
                                <SelectItem value="Naukri">Naukri</SelectItem>
                                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">Keyword</label>
                        <Input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. Java Developer"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or Paste URL</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">Job Link</label>
                        <Input
                            placeholder="https://www.indeed.com/..."
                            className="col-span-3"
                            onChange={(e) => {
                                const url = e.target.value;
                                if (url.includes('indeed')) setPlatform('Indeed');
                                if (url.includes('naukri')) setPlatform('Naukri');
                                if (url.includes('linkedin')) setPlatform('LinkedIn');
                                // Simple extraction simulation
                                if (url.length > 10) setKeyword('Imported Job Role');
                            }}
                        />
                    </div>

                    {loading && (
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Scraping {platform}...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Find Jobs
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
