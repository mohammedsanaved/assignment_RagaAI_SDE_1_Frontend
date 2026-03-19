import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { usePatientStore } from '@/src/app/store/patientStore';
import { useMemo, useState } from 'react';
import { exportToCsv } from '@/src/utils/exportCsv';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

export default function Analytics() {
  const { patients } = usePatientStore();
  const [isLast6Months, setIsLast6Months] = useState(false);

  const handleExport = () => {
    exportToCsv(patients, `healsync-patients-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredPatients = useMemo(() => {
    if (!isLast6Months) return patients;
    const sixMonthsAgo = dayjs().subtract(6, 'month');
    return patients.filter(p => p.createdAt && dayjs(p.createdAt).isAfter(sixMonthsAgo));
  }, [patients, isLast6Months]);

  const conditionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPatients.forEach(p => {
      counts[p.condition] = (counts[p.condition] || 0) + 1;
    });

    const colors = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#94a3b8', '#ec4899', '#8b5cf6'];
    
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredPatients]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      'Stable': 0,
      'Recovering': 0,
      'Critical': 0
    };
    filteredPatients.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return [
      { name: 'Stable', value: counts['Stable'], color: '#10b981' },
      { name: 'Recovering', value: counts['Recovering'], color: '#3b82f6' },
      { name: 'Critical', value: counts['Critical'], color: '#ef4444' }
    ];
  }, [filteredPatients]);

  const patientGrowth = useMemo(() => {
    const months: Record<string, number> = {};
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month').format('MMM');
      months[month] = 0;
    }

    filteredPatients.forEach(p => {
      if (p.createdAt) {
        const month = dayjs(p.createdAt).format('MMM');
        if (months[month] !== undefined) {
          months[month]++;
        } else if (!isLast6Months) {
          // If not filtering by last 6 months, we might want to show all months present
          months[month] = (months[month] || 0) + 1;
        }
      }
    });

    return Object.entries(months)
      .map(([month, count]) => ({ month, new: count }))
      .sort((a, b) => {
        // Find a patient in this month to get a real date for sorting
        const dateA = filteredPatients.find(p => p.createdAt && dayjs(p.createdAt).format('MMM') === a.month)?.createdAt;
        const dateB = filteredPatients.find(p => p.createdAt && dayjs(p.createdAt).format('MMM') === b.month)?.createdAt;
        if (dateA && dateB) return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
        
        // Fallback to chronological 6-month order
        const getMonthIndex = (m: string) => {
          for (let i = 11; i >= 0; i--) {
            if (dayjs().subtract(i, 'month').format('MMM') === m) return 11 - i;
          }
          return -1;
        };
        return getMonthIndex(a.month) - getMonthIndex(b.month);
      });
  }, [filteredPatients, isLast6Months]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Analytics</h1>
          <p className="text-slate-500">In-depth insights into patient demographics and clinical outcomes.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isLast6Months ? "primary" : "outline"} 
            className="gap-2"
            onClick={() => setIsLast6Months(!isLast6Months)}
          >
            <Calendar size={18} />
            Last 6 Months
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download size={18} />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient Growth</CardTitle>
            <CardDescription>New vs Returning patients per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="new" name="New Patients" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Patient breakdown by health status</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {statusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Condition Distribution</CardTitle>
            <CardDescription>Breakdown of primary patient conditions</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {conditionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="Patients" radius={[0, 4, 4, 0]}>
                    {conditionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
