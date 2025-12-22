import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Briefcase } from 'lucide-react';

export interface JobFormData {
    title: string;
    company: string;
    location: string;
    salary_range: string;
    employment_type: string;
    description: string;
    required_skills: string[];
    requirements: string;
}

interface PostJobModalProps {
    onPost: (jobData: JobFormData) => Promise<void>;
    triggerLabel?: string;
}

export function PostJobModal({ onPost, triggerLabel = "Post a Job" }: PostJobModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<JobFormData>({
        title: '',
        company: '',
        location: '',
        salary_range: '',
        employment_type: 'Full-time',
        description: '',
        required_skills: [],
        requirements: ''
    });
    const [skillsInput, setSkillsInput] = useState('');

    const handleChange = (field: keyof JobFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Process skills
        const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
        const finalData = { ...formData, required_skills: skills };

        await onPost(finalData);

        setLoading(false);
        setOpen(false);
        // Reset form
        setFormData({
            title: '',
            company: '',
            location: '',
            salary_range: '',
            employment_type: 'Full-time',
            description: '',
            required_skills: [],
            requirements: ''
        });
        setSkillsInput('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Post a New Job</DialogTitle>
                    <DialogDescription>
                        Fill in the details to post a new job opening.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input
                                id="title"
                                required
                                placeholder="e.g. Senior React Developer"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                required
                                placeholder="e.g. Tech Corp"
                                value={formData.company}
                                onChange={(e) => handleChange('company', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                required
                                placeholder="e.g. Remote / New York"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary Range</Label>
                            <Input
                                id="salary"
                                placeholder="e.g. $100k - $120k"
                                value={formData.salary_range}
                                onChange={(e) => handleChange('salary_range', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Employment Type</Label>
                        <Select
                            value={formData.employment_type}
                            onValueChange={(val) => handleChange('employment_type', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full-time">Full-time</SelectItem>
                                <SelectItem value="Part-time">Part-time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Internship">Internship</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">Required Skills (comma separated)</Label>
                        <Input
                            id="skills"
                            placeholder="React, TypeScript, Node.js"
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Job Description</Label>
                        <Textarea
                            id="description"
                            required
                            className="min-h-[100px]"
                            placeholder="Describe the role and responsibilities..."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="requirements">Requirements</Label>
                        <Textarea
                            id="requirements"
                            className="min-h-[80px]"
                            placeholder="List specific requirements, qualifications, etc."
                            value={formData.requirements}
                            onChange={(e) => handleChange('requirements', e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Post Job
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
