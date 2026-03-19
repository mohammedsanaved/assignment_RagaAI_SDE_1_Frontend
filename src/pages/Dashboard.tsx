import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import {
  Users,
  Activity,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UserPlus,
  BellRing,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/utils/cn';
import { useNotification } from '@/src/hooks/useNotification';
import { usePatientStore } from '@/src/app/store/patientStore';
import { useActivityStore } from '@/src/app/store/activityStore';
import { formatRelativeTime } from '@/src/utils/date';

export default function Dashboard() {
  const { patients } = usePatientStore();
  const { activities } = useActivityStore();
  const { sendNotification } = useNotification();

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const activeCases = patients.filter((p) => p.status === 'Critical').length;

    // Calculate trend for total patients (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const newPatientsLast7Days = patients.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= sevenDaysAgo,
    ).length;
    const newPatientsPrev7Days = patients.filter(
      (p) =>
        p.createdAt &&
        new Date(p.createdAt) >= fourteenDaysAgo &&
        new Date(p.createdAt) < sevenDaysAgo,
    ).length;

    let patientTrend = 0;
    if (newPatientsPrev7Days > 0) {
      patientTrend =
        ((newPatientsLast7Days - newPatientsPrev7Days) / newPatientsPrev7Days) *
        100;
    } else if (newPatientsLast7Days > 0) {
      patientTrend = 100;
    }

    return [
      {
        label: 'Total Patients',
        value: totalPatients.toLocaleString(),
        icon: Users,
        trend: `${patientTrend >= 0 ? '+' : ''}${patientTrend.toFixed(1)}%`,
        trendUp: patientTrend >= 0,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        label: 'Active Cases',
        value: activeCases.toString(),
        icon: Activity,
        trend: '-4.2%',
        trendUp: false,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        label: 'Appointments',
        value: '18',
        icon: Calendar,
        trend: '+8.1%',
        trendUp: true,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
      },
      {
        label: 'Avg. Recovery',
        value: '14 Days',
        icon: TrendingUp,
        trend: '+2.4%',
        trendUp: true,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ];
  }, [patients]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'New Patient':
        return UserPlus;
      case 'Appointment':
        return Calendar;
      case 'Check-up':
        return Activity;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'New Patient':
        return 'bg-emerald-100 text-emerald-600';
      case 'Appointment':
        return 'bg-blue-100 text-blue-600';
      case 'Check-up':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-amber-100 text-amber-600';
    }
  };

  const handleTestNotification = () => {
    sendNotification('System Alert', {
      body: 'The HealSync system is running smoothly.',
      icon: '/favicon.ico',
    });
  };

  // Calculate dynamic chart data based on patients created in the last 7 days
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        date: d.toISOString().split('T')[0],
        count: 0,
      };
    });

    patients.forEach((patient) => {
      if (patient.createdAt) {
        try {
          const patientDate = new Date(patient.createdAt)
            .toISOString()
            .split('T')[0];
          const dayMatch = last7Days.find((d) => d.date === patientDate);
          if (dayMatch) {
            dayMatch.count++;
          }
        } catch (e) {
          console.error('Error parsing patient date:', e);
        }
      }
    });

    return last7Days.map((d) => ({
      name: d.name,
      patients: d.count,
    }));
  }, [patients]);

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>
            Dashboard Overview
          </h1>
          <p className='text-slate-500'>
            Welcome back, here's what's happening today.
          </p>
        </div>
        <div className='flex gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleTestNotification}
            className='gap-2'
          >
            <BellRing size={16} />
            Test Notification
          </Button>
          <Badge variant='info' className='px-3 py-1'>
            v2.4.0
          </Badge>
          <Badge variant='success' className='px-3 py-1'>
            System Online
          </Badge>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className={cn('rounded-xl p-2', stat.bg)}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                {/*<div className={cn(
                  'flex items-center gap-1 text-xs font-bold',
                  stat.trendUp ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div> */}
              </div>
              <div className='mt-4'>
                <p className='text-sm font-medium text-slate-500'>
                  {stat.label}
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Patient Inflow</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id='colorPatients'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.1} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='#f1f5f9'
                />
                <XAxis
                  dataKey='name'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='patients'
                  stroke='#10b981'
                  strokeWidth={2}
                  fillOpacity={1}
                  fill='url(#colorPatients)'
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {activities.length > 0 ? (
                activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className='flex items-center gap-4'>
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl',
                          getActivityColor(activity.type),
                        )}
                      >
                        <Icon size={20} />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-slate-900'>
                          {activity.name}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {activity.type}
                        </p>
                      </div>
                      <p className='text-xs text-slate-400'>
                        {formatRelativeTime(activity.time)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-slate-400'>
                  <Clock size={32} className='mb-2 opacity-20' />
                  <p className='text-xs'>No recent activity</p>
                </div>
              )}
            </div>
            <Button variant='ghost' className='mt-6 w-full text-emerald-600'>
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
