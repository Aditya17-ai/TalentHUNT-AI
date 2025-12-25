export const calculateMatchScore = (jobSkills: string[], userSkills: string[]): number => {
    if (!jobSkills || jobSkills.length === 0) return 0;
    if (!userSkills || userSkills.length === 0) return 0;

    const normalizedJob = jobSkills.map(s => s.toLowerCase().trim());
    const normalizedUser = userSkills.map(s => s.toLowerCase().trim());

    let matches = 0;

    // Direct Set based overlap found to be too strict, so we use includes
    // to handle cases like "React.js" vs "React"
    normalizedJob.forEach(jSkill => {
        const isMatched = normalizedUser.some(uSkill =>
            uSkill.includes(jSkill) || jSkill.includes(uSkill)
        );
        if (isMatched) matches++;
    });

    return Math.round((matches / normalizedJob.length) * 100);
};

export const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
};
