import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl } = await req.json();
    
    if (!fileUrl) {
      throw new Error('File URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Download the file from storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract path from URL
    const urlParts = fileUrl.split('/');
    const bucket = urlParts[urlParts.length - 2];
    const filePath = urlParts.slice(urlParts.length - 2).join('/');

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath.replace('resumes/', ''));

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file');
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Analyzing resume with AI...');

    // Call Lovable AI to analyze the resume
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured information from resumes and return ONLY valid JSON.
Your response MUST be a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience_years": <number>,
  "education": "highest degree and institution",
  "summary": "brief professional summary"
}`
          },
          {
            role: 'user',
            content: `Parse this resume and extract: skills (array of strings), experience_years (total years as integer), education (highest degree and institution as string), and a brief summary.

Return ONLY the JSON object, no markdown formatting, no code blocks, no additional text.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_resume_data',
              description: 'Extract structured data from a resume',
              parameters: {
                type: 'object',
                properties: {
                  skills: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of technical and professional skills'
                  },
                  experience_years: {
                    type: 'integer',
                    description: 'Total years of professional experience'
                  },
                  education: {
                    type: 'string',
                    description: 'Highest educational qualification with institution name'
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief professional summary (2-3 sentences)'
                  }
                },
                required: ['skills', 'experience_years', 'education', 'summary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_resume_data' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI service quota exceeded. Please contact support.');
      }
      throw new Error('Failed to analyze resume with AI');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract the parsed data from tool call
    let parsedData;
    
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const argsString = aiData.choices[0].message.tool_calls[0].function.arguments;
      parsedData = typeof argsString === 'string' ? JSON.parse(argsString) : argsString;
    } else {
      throw new Error('No structured data returned from AI');
    }

    console.log('Parsed resume data:', parsedData);

    return new Response(
      JSON.stringify({
        skills: parsedData.skills || [],
        experience_years: parsedData.experience_years || 0,
        education: parsedData.education || '',
        summary: parsedData.summary || '',
        parsed_content: parsedData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
