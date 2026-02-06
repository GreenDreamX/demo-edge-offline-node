export interface DailyVisitStat {
    date: string;
    visits: number;
}

export interface DiagnosisStat {
    name: string;
    value: number;
}

export const generateMockStats = () => {
    // 1. Generate Last 7 Days Visits
    const dailyVisits: DailyVisitStat[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyVisits.push({
            date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            visits: Math.floor(Math.random() * 30) + 10 // Random between 10-40
        });
    }

    // 2. Generate Top Diagnoses
    const diagnosisStats: DiagnosisStat[] = [
        { name: 'ISPA', value: 35 },
        { name: 'Dihaerre', value: 25 },
        { name: 'Hipertensi', value: 20 },
        { name: 'Gastritis', value: 15 },
        { name: 'Diabetes', value: 5 },
    ];

    return { dailyVisits, diagnosisStats };
};
