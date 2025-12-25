import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { parseResume } from "@/utils/resumeParser";

interface ParsedResume {
  skills: string[];
  experience_years: number;
  education: string;
  summary?: string;
}

export const ResumeUpload = ({ userId, onUploadComplete }: { userId: string; onUploadComplete?: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // 1. Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setUploadProgress(60);
      setIsUploading(false);
      setIsParsing(true);
      toast.info('Analyzing resume with Python Engine...');

      // 2. Parse via Python Backend
      const formData = new FormData();
      formData.append('file', file);

      const parserResponse = await fetch('http://localhost:5000/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (!parserResponse.ok) throw new Error("Resume Parsing Failed");

      const parserJson = await parserResponse.json();
      const result: ParsedResume = {
        skills: parserJson.data.skills || [],
        experience_years: parserJson.data.experience_years || 0,
        education: parserJson.data.education || "Not specified",
        summary: parserJson.data.text_snippet
      };

      setUploadProgress(80);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_url: publicUrl,
          skills: result.skills,
          experience_years: result.experience_years,
          education: result.education,
          parsed_content: {
            text_snippet: result.summary,
            email: parserJson.data.email,
            phone: parserJson.data.phone
          }
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setParsedData(result);

      toast.success('Resume uploaded and analyzed successfully!');

      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload/parse resume');
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle>Upload Your Resume</CardTitle>
        </div>
        <CardDescription>Upload a PDF file for instant analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading || isParsing ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Extracting Data...'}
                  </p>
                </>
              ) : (
                <>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <p className="mb-2 text-sm text-foreground">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF only (max 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading || isParsing}
            />
          </label>
        </div>

        {(isUploading || isParsing) && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {parsedData && (
          <div className="space-y-4 p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Resume Analyzed Successfully!</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Extracted Skills:
                </p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.length > 0 ? parsedData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  )) : <p className="text-xs text-muted-foreground">No specific skills detected.</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Experience:</p>
                  <p className="text-sm text-muted-foreground">{parsedData.experience_years} years</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Education:</p>
                  <p className="text-sm text-muted-foreground">{parsedData.education}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
